// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Twilio Messaging webhook for the DEMO keyword 4-message sequence.
//
// Flow:
//   1. User texts "DEMO" → we mark any prior in-progress sequence for this
//      phone as superseded, insert a fresh demo_leads row, reply with MSG 1
//      via TwiML, and schedule MSG 2 to fire in ~30s via the cron.
//   2. User texts "YES" → we look up the active sequence, reply with MSG 2
//      via TwiML, and schedule MSG 3 for ~60s. If they don't reply YES, the
//      cron sends MSG 2 on its own when the 30s timer matures.
//   3. STOP / HELP keywords are honored before everything else (compliance).
//   4. Any other text is a no-op (no auto-reply).
//
// MSG 3 and MSG 4 are always sent by the cron at /api/cron/demo-sequence.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  detectComplianceIntent,
  markOptedOut,
  clearOptOut,
  isOptedOut,
  withOptOutNotice,
  STOP_CONFIRMATION,
  START_CONFIRMATION,
  HELP_RESPONSE,
} from '@/lib/sms-opt-outs';
import { DEMO_MSG, DELAY_TO_MSG_2_MS, DELAY_TO_MSG_3_MS } from '@/lib/demo-sequence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// ─── Intent detection ────────────────────────────────────────────

function firstWord(text: string): string {
  return text.trim().toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)[0] || '';
}
function tokenCount(text: string): number {
  return text.trim().toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function isDemoKeyword(text: string): boolean {
  // Single-word or first-word match in a short message.
  if (!text) return false;
  if (firstWord(text) !== 'demo') return false;
  return tokenCount(text) <= 3;
}

function isYesKeyword(text: string): boolean {
  if (!text) return false;
  const w = firstWord(text);
  if (!['yes', 'y', 'yeah', 'yep', 'yup'].includes(w)) return false;
  return tokenCount(text) <= 3;
}

// ─── TwiML ───────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function twiml(body: string | null) {
  const xml = body == null
    ? `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
  return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

// ─── DB helpers ──────────────────────────────────────────────────

async function findActiveSession(supabase: SupabaseClient, phone: string) {
  const { data } = await supabase
    .from('demo_leads')
    .select('id, step_completed, next_msg_due_at, yes_received_at')
    .eq('phone_number', phone)
    .eq('source', 'demo-keyword')
    .is('completed_at', null)
    .is('superseded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { id: string; step_completed: number; next_msg_due_at: string | null; yes_received_at: string | null } | null;
}

async function startNewSession(supabase: SupabaseClient, phone: string): Promise<void> {
  // Supersede any prior in-progress sequence for this phone, then insert fresh.
  const nowIso = new Date().toISOString();
  const { error: updErr } = await supabase
    .from('demo_leads')
    .update({ superseded_at: nowIso })
    .eq('phone_number', phone)
    .eq('source', 'demo-keyword')
    .is('completed_at', null)
    .is('superseded_at', null);
  if (updErr) console.error('[demo-webhook] startNewSession supersede update failed:', updErr.message);

  const next = new Date(Date.now() + DELAY_TO_MSG_2_MS).toISOString();
  const { data: inserted, error: insErr } = await supabase
    .from('demo_leads')
    .insert({
      phone_number: phone,
      source: 'demo-keyword',
      keyword: 'DEMO',
      sms_sent: true,           // MSG 1 just went out via TwiML
      sms_sent_at: nowIso,
      step_completed: 1,
      next_msg_due_at: next,
    })
    .select('id');
  if (insErr) {
    console.error('[demo-webhook] startNewSession insert failed:', insErr.message, JSON.stringify(insErr));
  } else {
    console.log('[demo-webhook] startNewSession ok:', inserted?.[0]?.id, 'phone=', phone);
  }
}

// CAS-update: only advance step if it's still at expected. Returns true on win.
async function advanceStep(
  supabase: SupabaseClient,
  id: string,
  fromStep: number,
  toStep: number,
  nextDueAtMs: number | null,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    step_completed: toStep,
    next_msg_due_at: nextDueAtMs == null ? null : new Date(nextDueAtMs).toISOString(),
    ...extra,
  };
  if (toStep >= 4) patch.completed_at = new Date().toISOString();
  const { data } = await supabase
    .from('demo_leads')
    .update(patch)
    .eq('id', id)
    .eq('step_completed', fromStep)
    .select('id');
  return Array.isArray(data) && data.length > 0;
}

// ─── Main handler ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    // Allow JSON callers for testing.
    try {
      const body = await req.json();
      return handleInbound(String(body?.From || ''), String(body?.Body || ''), false);
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }
  const form = await req.formData();
  const from = String(form.get('From') || '');
  const text = String(form.get('Body') || '');
  return handleInbound(from, text, true);
}

async function handleInbound(from: string, text: string, isTwilio: boolean) {
  if (!from) return isTwilio ? twiml(null) : NextResponse.json({ error: 'Missing sender' }, { status: 400 });

  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // ── Compliance first ──
  const compliance = detectComplianceIntent(text);
  if (compliance === 'stop') {
    if (supabase) await markOptedOut(supabase, from, 'demo-webhook', text).catch(() => {});
    return isTwilio ? twiml(STOP_CONFIRMATION) : NextResponse.json({ reply: STOP_CONFIRMATION });
  }
  if (compliance === 'start') {
    if (supabase) await clearOptOut(supabase, from).catch(() => {});
    return isTwilio ? twiml(START_CONFIRMATION) : NextResponse.json({ reply: START_CONFIRMATION });
  }
  if (compliance === 'help') {
    return isTwilio ? twiml(HELP_RESPONSE) : NextResponse.json({ reply: HELP_RESPONSE });
  }

  // ── Opted-out → silent no-op ──
  if (supabase && await isOptedOut(supabase, from)) {
    return isTwilio ? twiml(null) : NextResponse.json({ reply: '' });
  }

  // ── DEMO keyword: start (or restart) the 4-msg sequence ──
  if (isDemoKeyword(text)) {
    const msg1 = withOptOutNotice(DEMO_MSG.one);
    if (supabase) {
      try { await startNewSession(supabase, from); }
      catch (err) { console.error('[demo-webhook] startNewSession failed:', err); }
    }
    return isTwilio ? twiml(msg1) : NextResponse.json({ reply: msg1 });
  }

  // ── YES → close with the Founding Client Stripe checkout link ──
  // We respond regardless of session state so a YES always triggers the link
  // (the user has explicitly opted in by replying YES). If there IS an active
  // sequence we mark it completed so the cron stops sending further nudges.
  if (isYesKeyword(text)) {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('demo_leads')
          .update({
            completed_at: new Date().toISOString(),
            yes_received_at: new Date().toISOString(),
          })
          .eq('phone_number', from)
          .eq('source', 'demo-keyword')
          .is('completed_at', null)
          .is('superseded_at', null);
        if (error) console.error('[demo-webhook] mark-completed on YES failed:', error.message);
      } catch (err) {
        console.error('[demo-webhook] mark-completed on YES threw:', err);
      }
    }

    // Stable Founding Client Payment Link. Already wired in Stripe with the
    // $400→$200 FOUNDING coupon on the setup line + $99/mo subscription.
    // Override via env if you ever regenerate the link.
    const url =
      process.env.STRIPE_FOUNDING_PAYMENT_LINK ||
      'https://buy.stripe.com/00w8wP86w5f8cBP08P8IU01';
    const replyText = `🚀 Let's get you started with GoElev8.ai today — $200 Founding Client setup + $99/mo (normally $400, save 50%): ${url}\n\nGo live in 48 hours.`;
    return isTwilio ? twiml(withOptOutNotice(replyText)) : NextResponse.json({ reply: withOptOutNotice(replyText) });
  }

  // ── Anything else → no auto-reply (per spec) ──
  return isTwilio ? twiml(null) : NextResponse.json({ reply: '' });
}
