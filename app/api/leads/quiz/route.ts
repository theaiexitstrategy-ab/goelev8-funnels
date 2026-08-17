// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/leads/quiz
//
// Captures a lead from the AI Readiness Score quiz on the goelev8.ai
// homepage hero. Three things happen, in this order, none of them
// blocking the others:
//
//   1. Send an outbound Twilio SMS to the lead FROM +18883020649
//      confirming their score + linking to book.goelev8.ai/go.
//   2. Insert the lead into the Supabase `leads` table (source=
//      'goelev8-hero-quiz'). Best-effort — if the insert fails
//      (missing client_id, network, etc.) we log the error but
//      don't fail the request. The Aaron-notify SMS is the backup
//      record.
//   3. Send an admin-notify SMS to Aaron with the lead summary so
//      even if the DB insert fails he has the info to follow up.
//
// Always returns HTTP 200 so the client UI never shows an error to
// the buyer — the quiz result reveal is the user's win, not a form
// success state.

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAdminSMS } from '@/lib/onboarding-runtime';

export const runtime = 'nodejs';

type QuizAnswer = { q: string; v: number };
type QuizBody = {
  name?: string;
  email?: string;
  phone?: string;
  readiness_score?: number;
  tier?: string;
  answers?: QuizAnswer[];
};

const LEAD_SMS_FROM = process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER ?? '';
const BOOK_URL = 'book.goelev8.ai/go';

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

async function sendLeadSMS(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !LEAD_SMS_FROM) {
    console.warn('[leads/quiz] sendLeadSMS skipped — Twilio env missing');
    return { ok: false, error: 'Twilio env missing' };
  }
  try {
    const params = new URLSearchParams({ To: to, From: LEAD_SMS_FROM, Body: body });
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );
    if (!res.ok) {
      const t = await res.text();
      console.error('[leads/quiz] Twilio lead SMS failed:', res.status, t);
      return { ok: false, error: `Twilio ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[leads/quiz] Twilio lead SMS threw:', err?.message ?? err);
    return { ok: false, error: err?.message ?? 'Twilio threw' };
  }
}

export async function POST(req: NextRequest) {
  let body: QuizBody = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' });
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const phoneRaw = (body.phone ?? '').trim();
  const score = Number(body.readiness_score ?? 0);
  const tier = String(body.tier ?? '').trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!name || !email || !phoneRaw) {
    return Response.json({ success: false, error: 'Missing name/email/phone' });
  }

  const phoneE164 = normalizePhone(phoneRaw);
  const firstName = name.split(/\s+/)[0] || name;

  // ── 1. Outbound SMS to lead (best-effort, first so the confirmation
  //       text arrives even if the DB insert lags) ──
  if (phoneE164) {
    const leadMsg =
      `${firstName} — you scored ${score}/100 on the AI Readiness quiz${tier ? ` (${tier})` : ''}.\n\n` +
      `Book a free strategy call: ${BOOK_URL}\n\n` +
      `Reply STOP to opt out.`;
    void sendLeadSMS(phoneE164, leadMsg);
  } else {
    console.warn('[leads/quiz] Invalid phone format, skipping outbound SMS:', phoneRaw);
  }

  // ── 2. Insert into Supabase leads. client_id is NOT NULL on that table
  //       so we look up the 'goelev8' house client. If nothing matches,
  //       skip the insert (the admin-notify SMS below is the paper trail). ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .in('slug', ['goelev8', 'goelev8-ai', 'goelev8ai'])
        .limit(1)
        .maybeSingle();

      if (client?.id) {
        const insertRow = {
          client_id: client.id,
          name,
          phone: phoneE164 ?? phoneRaw,
          email,
          source: 'goelev8-hero-quiz',
          funnel: 'goelev8-hero',
          intent: `AI Readiness Quiz — ${score}/100${tier ? ` (${tier})` : ''}`,
          notes: `Quiz: ${score}/100 ${tier}`.trim(),
          status: 'new',
          lead_status: 'new',
          lead_source: 'goelev8-hero-quiz',
          payload: {
            readiness_score: score,
            tier,
            answers,
            page: 'goelev8.ai',
            submitted_at: new Date().toISOString(),
          },
        };
        const { error: insErr } = await supabase.from('leads').insert(insertRow);
        if (insErr) {
          console.error('[leads/quiz] leads insert failed:', insErr.message);
        } else {
          console.log('[leads/quiz] lead saved:', name, '·', email, '·', score);
        }
      } else {
        console.warn(
          '[leads/quiz] No goelev8 client row in Supabase — skipping insert. Add a clients row with slug=goelev8 to enable lead persistence.',
        );
      }
    } catch (err: any) {
      console.error('[leads/quiz] Supabase insert threw:', err?.message ?? err);
    }
  }

  // ── 3. Admin-notify Aaron so a lead never falls through the cracks ──
  const adminMsg =
    `🎯 Quiz lead · ${score}/100${tier ? ` ${tier}` : ''} · ` +
    `${name} · ${email} · ${phoneE164 ?? phoneRaw}`;
  void notifyAdminSMS(adminMsg);

  return Response.json({ success: true });
}
