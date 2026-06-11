// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Twilio statusCallback handler for missed calls.
//
// Wire as: Twilio Console → Phone Numbers → <your number> → Voice
// Configuration → Status Callback URL = https://www.goelev8.ai/api/missed-call
//
// Behavior:
//   - Fires on EVERY status change Twilio reports for the call. We only act
//     when CallStatus is no-answer / busy / failed / canceled.
//   - Idempotent on CallSid via the unique index on missed_calls.call_sid —
//     duplicate callbacks for the same Sid no-op cleanly.
//   - Skips opted-out numbers per the global sms_opt_outs suppression list.
//   - "completed" calls (someone actually answered) are silently ignored.
//
// HEADS UP: if you wire this on the same Twilio number as the existing
// /api/calls/inbound voice webhook, the SMS text-back will fire twice
// (once from inbound's dial-result, once here). Either remove the SMS
// branch from inbound's dial-result or pick one webhook to be canonical.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { isOptedOut, withOptOutNotice } from '@/lib/sms-opt-outs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom =
  process.env.TWILIO_DEMO_NUMBER ||
  process.env.TWILIO_TOLL_FREE ||
  process.env.TWILIO_MASTER_NUMBER ||
  '';

const MISSED_STATUSES = new Set(['no-answer', 'busy', 'failed', 'canceled']);

const MISSED_CALL_SMS =
  `Hey, sorry we missed your call! How can we assist you today? Reply here and we'll get right back to you. — GoElev8.ai`;

async function sendTwilioSms(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { error: 'Twilio not configured' };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const auth = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `twilio ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json().catch(() => ({}));
  return { sid: data.sid };
}

async function recordAndMaybeText(supabase: SupabaseClient | null, callSid: string, phone: string, status: string) {
  // Insert first (idempotent via unique index). If already exists, no-op.
  let alreadyRecorded = false;
  if (supabase) {
    const ins = await supabase
      .from('missed_calls')
      .insert({ phone, call_sid: callSid || null, call_status: status })
      .select('id');
    if (ins.error && (ins.error as any).code === '23505') {
      alreadyRecorded = true;
    } else if (ins.error) {
      console.error('[missed-call] insert failed:', ins.error.message);
    }
  }
  if (alreadyRecorded) return; // duplicate callback for this Sid

  // Suppression check.
  if (supabase && await isOptedOut(supabase, phone)) {
    console.log('[missed-call] skipped SMS to opted-out number', phone);
    return;
  }

  const { sid, error } = await sendTwilioSms(phone, withOptOutNotice(MISSED_CALL_SMS));
  if (supabase) {
    await supabase
      .from('missed_calls')
      .update({ sms_sent: !error, sms_sid: sid ?? null, sms_error: error ?? null })
      .eq('call_sid', callSid);
  }
  if (error) console.error('[missed-call] sms failed:', error);
}

export async function POST(req: NextRequest) {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  let from = '', callSid = '', status = '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    from = String(form.get('From') || '');
    callSid = String(form.get('CallSid') || '');
    status = String(form.get('CallStatus') || '').toLowerCase();
  } else {
    try {
      const body = await req.json();
      from = String(body?.From || body?.from || '');
      callSid = String(body?.CallSid || body?.callSid || '');
      status = String(body?.CallStatus || body?.callStatus || '').toLowerCase();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
    }
  }

  // Twilio expects 200 on statusCallback regardless. We log and exit on
  // statuses we don't care about (completed = answered, ringing/in-progress
  // = mid-call, etc.).
  if (!MISSED_STATUSES.has(status)) {
    return NextResponse.json({ ok: true, ignored: status });
  }
  if (!from) {
    return NextResponse.json({ ok: true, error: 'no from' });
  }

  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  try {
    await recordAndMaybeText(supabase, callSid, from, status);
  } catch (err) {
    console.error('[missed-call] handler error:', err);
  }
  return NextResponse.json({ ok: true });
}
