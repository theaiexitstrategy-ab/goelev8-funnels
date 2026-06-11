// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Vercel Cron — every minute. Drives the DEMO 4-message sequence forward:
//
//   step_completed = 1 → send MSG 2, schedule MSG 3 for ~60s later
//   step_completed = 2 → send MSG 3, schedule MSG 4 for ~60s later
//   step_completed = 3 → send MSG 4, mark completed
//
// Race-safe via compare-and-swap update on step_completed. Skips rows for
// opted-out phones and stamps them as terminally handled.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { getOptedOutSet, withOptOutNotice } from '@/lib/sms-opt-outs';
import { DEMO_MSG, DELAY_TO_MSG_3_MS as LIB_DELAY_3, DELAY_TO_MSG_4_MS as LIB_DELAY_4 } from '@/lib/demo-sequence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom =
  process.env.TWILIO_DEMO_NUMBER ||
  process.env.TWILIO_TOLL_FREE ||
  process.env.TWILIO_MASTER_NUMBER ||
  '';

const MAX_PER_RUN = 50;
const DELAY_TO_MSG_3_MS = LIB_DELAY_3;
const DELAY_TO_MSG_4_MS = LIB_DELAY_4;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function sendTwilioSms(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!twilioSid || !twilioToken || !twilioFrom) return { error: 'Twilio not configured' };
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

// Compare-and-swap: only advance if step_completed is still at fromStep.
// Returns true if we won the race.
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

function bodyForNextStep(currentStep: number): string {
  if (currentStep === 1) return DEMO_MSG.two;
  if (currentStep === 2) return DEMO_MSG.three;
  if (currentStep === 3) return DEMO_MSG.four;
  return '';
}

function nextDelayMs(afterStep: number): number | null {
  if (afterStep === 2) return DELAY_TO_MSG_3_MS;
  if (afterStep === 3) return DELAY_TO_MSG_4_MS;
  return null; // completion
}

async function processDueRows(): Promise<{ processed: number; sent: number; failed: number; skipped: number; results: Array<Record<string, unknown>> }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('demo_leads')
    .select('id, phone_number, step_completed')
    .eq('source', 'demo-keyword')
    .is('completed_at', null)
    .is('superseded_at', null)
    .lte('next_msg_due_at', nowIso)
    .in('step_completed', [1, 2, 3])
    .order('next_msg_due_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) return { processed: 0, sent: 0, failed: 0, skipped: 0, results: [{ error: error.message }] };
  if (!due || due.length === 0) return { processed: 0, sent: 0, failed: 0, skipped: 0, results: [] };

  const optedOut = await getOptedOutSet(supabase, due.map((r) => r.phone_number as string));

  let sent = 0, failed = 0, skipped = 0;
  const results: Array<Record<string, unknown>> = [];

  for (const row of due) {
    const phone = row.phone_number as string;
    const fromStep = row.step_completed as number;
    const toStep = fromStep + 1;

    // Skip opted-out — mark terminally completed.
    if (optedOut.has(phone)) {
      await supabase
        .from('demo_leads')
        .update({ completed_at: new Date().toISOString(), error: 'opted-out' })
        .eq('id', row.id);
      skipped++;
      results.push({ id: row.id, status: 'skipped-opt-out', phone });
      continue;
    }

    const body = bodyForNextStep(fromStep);
    if (!body) { skipped++; continue; }

    const { sid, error: smsErr } = await sendTwilioSms(phone, withOptOutNotice(body));

    // Whether send succeeded or failed, advance the step so we don't retry
    // every minute forever. Stash the error if there was one.
    const delay = nextDelayMs(toStep);
    const nextDueMs = delay == null ? null : Date.now() + delay;

    const advanced = await advanceStep(
      supabase, row.id, fromStep, toStep, nextDueMs,
      smsErr ? { error: smsErr } : { sms_sent_at: new Date().toISOString(), vapi_call_id: sid ?? null },
    );

    if (!advanced) {
      // Race — another worker (or the YES inbound handler) already advanced it.
      skipped++;
      results.push({ id: row.id, status: 'race-lost', step: fromStep });
      continue;
    }
    if (smsErr) {
      failed++;
      results.push({ id: row.id, status: 'twilio-error', step: toStep, error: smsErr });
    } else {
      sent++;
      results.push({ id: row.id, status: 'sent', step: toStep, sid });
    }
  }

  return { processed: due.length, sent, failed, skipped, results };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  try {
    const summary = await processDueRows();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: any) {
    console.error('[demo-sequence] fatal:', err);
    return NextResponse.json({ error: err?.message || 'fatal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
