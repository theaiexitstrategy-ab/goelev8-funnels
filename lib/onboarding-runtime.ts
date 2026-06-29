// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Runtime helpers shared by the Stripe webhook, the conversational onboarding
// agent, and the provisioning pipeline:
//   - resume-token validation (used by every onboarding API route)
//   - Twilio SMS to Aaron (signup notify, completed-onboarding notify)
//   - Resend email to Aaron (signup notify, provisioning summary)
//   - sms_credits + credit_ledger initialization for a new client
//
// Every helper is best-effort: if Twilio/Resend env vars are missing we log
// and return — we never throw and break the Stripe webhook flow.

import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { OnboardingConfig } from './onboarding-configs';

const ADMIN_EMAIL = 'ab@goelev8.ai';
const RESEND_FROM = 'GoElev8.ai <noreply@goelev8.ai>';

function adminPhone(): string | null {
  const raw = process.env.ADMIN_PHONE ?? process.env.AARON_PHONE ?? null;
  if (!raw) return null;
  // Normalize to E.164-ish; Twilio rejects unformatted numbers.
  return raw.startsWith('+') ? raw : `+1${raw.replace(/\D/g, '')}`;
}

// ── resume token guard ───────────────────────────────────────────────────

export type ResumeAuthResult =
  | { ok: true; client: ClientRow }
  | { ok: false; status: number; error: string };

export type ClientRow = {
  id: string;
  slug: string;
  name: string | null;
  email: string | null;
  business_name: string | null;
  brand_color: string | null;
  plan: string | null;
  tier: string | null;
  resume_token: string;
  onboarding_status: string | null;
  onboarding_step: number | null;
  onboarding_config_slug: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  vapi_api_key: string | null;
  platform_fee_pct: number | null;
};

export async function authenticateResumeToken(
  supabase: SupabaseClient,
  slug: string,
  token: string | null,
): Promise<ResumeAuthResult> {
  if (!token) return { ok: false, status: 401, error: 'Missing resume token' };
  // UUID sanity check — drops obviously malformed tokens before hitting db.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return { ok: false, status: 401, error: 'Invalid token format' };
  }
  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, slug, name, email, business_name, brand_color, plan, tier, resume_token, onboarding_status, onboarding_step, onboarding_config_slug, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, vapi_api_key, platform_fee_pct',
    )
    .eq('onboarding_config_slug', slug)
    .eq('resume_token', token)
    .maybeSingle();

  if (error) {
    console.error('[onboarding-runtime] auth lookup failed:', error.message);
    return { ok: false, status: 500, error: 'Auth lookup failed' };
  }
  if (!data) return { ok: false, status: 401, error: 'Invalid or expired token' };
  return { ok: true, client: data as ClientRow };
}

// ── Twilio SMS to Aaron ──────────────────────────────────────────────────

export async function notifyAdminSMS(message: string): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;
  const to = adminPhone();
  if (!sid || !token || !from || !to) {
    console.warn('[onboarding-runtime] notifyAdminSMS skipped — missing env (sid/token/from/admin_phone)');
    return { ok: false, error: 'Twilio env missing' };
  }
  try {
    const body = new URLSearchParams({ To: to, From: from, Body: message });
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[onboarding-runtime] Twilio admin SMS failed:', res.status, text);
      return { ok: false, error: `Twilio ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[onboarding-runtime] Twilio admin SMS threw:', err?.message ?? err);
    return { ok: false, error: err?.message ?? 'Twilio threw' };
  }
}

// ── Resend email to Aaron ────────────────────────────────────────────────

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[onboarding-runtime] Resend not configured — admin email skipped');
    return null;
  }
  return new Resend(key);
}

export async function notifyAdminEmail(args: {
  subject: string;
  htmlBody: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = resendClient();
  if (!r) return { ok: false, error: 'Resend env missing' };
  try {
    const { error } = await r.emails.send({
      from: RESEND_FROM,
      to: ADMIN_EMAIL,
      subject: args.subject,
      html: args.htmlBody,
    });
    if (error) {
      console.error('[onboarding-runtime] Resend admin email failed:', error);
      return { ok: false, error: String(error.message ?? error) };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[onboarding-runtime] Resend admin email threw:', err?.message ?? err);
    return { ok: false, error: err?.message ?? 'Resend threw' };
  }
}

// ── sms_credits + credit_ledger seeding ─────────────────────────────────

export async function ensureInitialSmsCredits(
  supabase: SupabaseClient,
  args: {
    clientId: string;          // uuid string (clients.id)
    clientSlug: string;        // text (sms_credits keys on client_id text)
    initialBalance: number;
    cfg: OnboardingConfig;
  },
): Promise<void> {
  // sms_credits uses client_id (text) — we key by slug, not uuid.
  const { data: existing } = await supabase
    .from('sms_credits')
    .select('client_id, balance')
    .eq('client_id', args.clientSlug)
    .maybeSingle();

  if (!existing) {
    const { error: smsErr } = await supabase.from('sms_credits').insert({
      client_id: args.clientSlug,
      balance: args.initialBalance,
    });
    if (smsErr) console.error('[onboarding-runtime] sms_credits insert failed:', smsErr.message);
  } else if ((existing.balance ?? 0) <= 0) {
    const { error: updErr } = await supabase
      .from('sms_credits')
      .update({ balance: args.initialBalance })
      .eq('client_id', args.clientSlug);
    if (updErr) console.error('[onboarding-runtime] sms_credits update failed:', updErr.message);
  }

  // credit_ledger uses client_id (uuid). Skip if a signup_bonus row already
  // exists for this client to keep this idempotent under Stripe retries.
  const { data: existingLedger } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('client_id', args.clientId)
    .eq('reason', 'signup_bonus')
    .maybeSingle();

  if (existingLedger) return;

  const { error: ledgerErr } = await supabase.from('credit_ledger').insert({
    client_id: args.clientId,
    delta: args.initialBalance,
    reason: 'signup_bonus',
    ref_id: args.cfg.slug,
    pack: 'included',
    amount_cents: 0,
  });
  if (ledgerErr) console.error('[onboarding-runtime] credit_ledger insert failed:', ledgerErr.message);
}

// ── small html helpers for admin emails ─────────────────────────────────

export function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}
