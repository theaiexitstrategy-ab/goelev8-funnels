// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Twilio Messaging webhook for the DEMO 4-message sequence. The sequence is
// purely keyword-driven now — every message is triggered by the recipient
// replying with the next keyword. The time-based cron path (which used to
// auto-send MSG 2/3/4 if they didn't reply) is intentionally idle because we
// no longer stamp next_msg_due_at.
//
// Flow:
//   DEMO  → MSG 1 (intro: "you just triggered our automated follow-up")
//   YES   → MSG 2 (here's what just happened in 60s)
//   READY → MSG 3 (social proof — Flex, iSlay, WillPower)
//   GO    → MSG 4 (Founding Client offer + stable Stripe Payment Link)
//
// Client-specific demo keywords:
//   LAW   → McClain Law traffic-ticket intake assistant preview
//           (Attorney: Tarihya McClain)
//           (triggered from the sms:+18883020649?&body=LAW link on
//            goelev8.ai/mcclain/demo)
//   BOOK  → Follow-up confirmation for anyone who tapped "Reply BOOK"
//           in the LAW response
//
// Compliance keywords (STOP / UNSUBSCRIBE / HELP / START) run BEFORE any
// keyword detection, so they always win. Any other inbound text returns
// empty TwiML — no auto-reply per spec.

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
import { DEMO_MSG, FOUNDING_PAYMENT_LINK } from '@/lib/demo-sequence';

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

function isReadyKeyword(text: string): boolean {
  if (!text) return false;
  if (firstWord(text) !== 'ready') return false;
  return tokenCount(text) <= 3;
}

function isGoKeyword(text: string): boolean {
  if (!text) return false;
  if (firstWord(text) !== 'go') return false;
  return tokenCount(text) <= 3;
}

function isLawKeyword(text: string): boolean {
  if (!text) return false;
  if (firstWord(text) !== 'law') return false;
  return tokenCount(text) <= 3;
}

function isBookKeyword(text: string): boolean {
  if (!text) return false;
  if (firstWord(text) !== 'book') return false;
  return tokenCount(text) <= 3;
}

// ─── McClain intake demo messages ────────────────────────────────

const MCCLAIN_LAW_MSG =
  "Thanks for testing McClain Law's intake assistant 👋\n\n" +
  'In under 60 seconds, a real lead texting this number would get:\n' +
  '1. Instant reply\n' +
  '2. Ticket type + county + court date confirmed\n' +
  '3. Auto-routed to the right attorney\n' +
  '4. Consult booked by text — on the calendar\n\n' +
  "That's what your firm's leads would experience.\n\n" +
  'Want a live walkthrough? Reply BOOK.';

const MCCLAIN_BOOK_MSG =
  "Perfect. Aaron @ GoElev8.ai will text this number within 1 business day to set up your walkthrough.\n\n" +
  'Need it sooner? Email ab@goelev8.ai or reply here with a good time.';

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

async function startNewSession(supabase: SupabaseClient, phone: string): Promise<void> {
  // Supersede any prior in-progress sequence for this phone, then insert fresh.
  // Sequence is now keyword-driven (DEMO → YES → READY → GO), so next_msg_due_at
  // is intentionally left null — the cron path stays in place but stops firing.
  const nowIso = new Date().toISOString();
  const { error: updErr } = await supabase
    .from('demo_leads')
    .update({ superseded_at: nowIso })
    .eq('phone_number', phone)
    .eq('source', 'demo-keyword')
    .is('completed_at', null)
    .is('superseded_at', null);
  if (updErr) console.error('[demo-webhook] startNewSession supersede update failed:', updErr.message);

  const { data: inserted, error: insErr } = await supabase
    .from('demo_leads')
    .insert({
      phone_number: phone,
      source: 'demo-keyword',
      keyword: 'DEMO',
      sms_sent: true,           // MSG 1 just went out via TwiML
      sms_sent_at: nowIso,
      step_completed: 1,
    })
    .select('id');
  if (insErr) {
    console.error('[demo-webhook] startNewSession insert failed:', insErr.message, JSON.stringify(insErr));
  } else {
    console.log('[demo-webhook] startNewSession ok:', inserted?.[0]?.id, 'phone=', phone);
  }
}

// Best-effort advance: update step_completed for the active session for this
// phone. Doesn't block the SMS reply if the update fails — the customer still
// gets the message, this just tracks where they are in the funnel.
async function advanceActiveSession(
  supabase: SupabaseClient,
  phone: string,
  toStep: number,
  extra: Record<string, unknown> = {},
): Promise<void> {
  try {
    const patch: Record<string, unknown> = { step_completed: toStep, ...extra };
    if (toStep >= 4) patch.completed_at = new Date().toISOString();
    const { error } = await supabase
      .from('demo_leads')
      .update(patch)
      .eq('phone_number', phone)
      .eq('source', 'demo-keyword')
      .is('completed_at', null)
      .is('superseded_at', null);
    if (error) console.error(`[demo-webhook] advance to step ${toStep} failed:`, error.message);
  } catch (err) {
    console.error(`[demo-webhook] advance to step ${toStep} threw:`, err);
  }
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

  // ── YES → MSG 2 ("here's what just happened") ──
  if (isYesKeyword(text)) {
    if (supabase) await advanceActiveSession(supabase, from, 2, { yes_received_at: new Date().toISOString() });
    const reply = withOptOutNotice(DEMO_MSG.two);
    return isTwilio ? twiml(reply) : NextResponse.json({ reply });
  }

  // ── READY → MSG 3 (social proof) ──
  if (isReadyKeyword(text)) {
    if (supabase) await advanceActiveSession(supabase, from, 3);
    const reply = withOptOutNotice(DEMO_MSG.three);
    return isTwilio ? twiml(reply) : NextResponse.json({ reply });
  }

  // ── GO → MSG 4 (Founding Client offer + Stripe Payment Link) ──
  if (isGoKeyword(text)) {
    if (supabase) await advanceActiveSession(supabase, from, 4);
    const url = process.env.STRIPE_FOUNDING_PAYMENT_LINK || FOUNDING_PAYMENT_LINK;
    const reply = withOptOutNotice(DEMO_MSG.four(url));
    return isTwilio ? twiml(reply) : NextResponse.json({ reply });
  }

  // ── LAW → McClain traffic-ticket intake preview ──
  // Triggered by the sms:+18883020649?&body=LAW link on
  // goelev8.ai/mcclain/demo. Best-effort log to demo_leads under a
  // distinct source; skip on failure so the reply still fires.
  if (isLawKeyword(text)) {
    if (supabase) {
      try {
        const nowIso = new Date().toISOString();
        await supabase
          .from('demo_leads')
          .insert({
            phone_number: from,
            source: 'mcclain-law-keyword',
            keyword: 'LAW',
            sms_sent: true,
            sms_sent_at: nowIso,
            step_completed: 1,
          });
      } catch (err) {
        console.error('[demo-webhook] mcclain LAW log failed:', err);
      }
    }
    const reply = withOptOutNotice(MCCLAIN_LAW_MSG);
    return isTwilio ? twiml(reply) : NextResponse.json({ reply });
  }

  // ── BOOK → McClain intake follow-up ──
  if (isBookKeyword(text)) {
    if (supabase) {
      try {
        await supabase
          .from('demo_leads')
          .update({ step_completed: 2, completed_at: new Date().toISOString() })
          .eq('phone_number', from)
          .eq('source', 'mcclain-law-keyword')
          .is('completed_at', null);
      } catch (err) {
        console.error('[demo-webhook] mcclain BOOK update failed:', err);
      }
    }
    const reply = withOptOutNotice(MCCLAIN_BOOK_MSG);
    return isTwilio ? twiml(reply) : NextResponse.json({ reply });
  }

  // ── Anything else → no auto-reply (per spec) ──
  return isTwilio ? twiml(null) : NextResponse.json({ reply: '' });
}
