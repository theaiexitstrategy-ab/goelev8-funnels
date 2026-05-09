// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Vercel Cron — fires daily at 14:00 UTC (= 9:00 AM CDT during DST).
// For every sms_uplift_nudges row whose due_at has passed and sent_at is
// still null, generate a fresh personalized message via Claude using the
// day-themed instruction, send it from the Uplift Twilio number, and stamp
// the row with sent_at + message + twilio_sid (or error on failure).
//
// Vercel passes Authorization: Bearer ${CRON_SECRET} when CRON_SECRET is set
// in env. We require it in production; in dev (no secret) the route is open.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { PROFILES, CLOSING, generateMessage, instructionForDay } from '@/lib/sms-uplift';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom =
  process.env.TWILIO_UPLIFT_NUMBER ||
  process.env.TWILIO_SMS_NUMBER ||
  process.env.TWILIO_TOLL_FREE ||
  process.env.TWILIO_MASTER_NUMBER ||
  '';

const MAX_PER_RUN = 50;

// ─── Twilio outbound ─────────────────────────────────────────────

async function sendSms(to: string, body: string): Promise<{ sid?: string; error?: string }> {
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { error: 'Twilio not configured (need TWILIO_ACCOUNT_SID, _AUTH_TOKEN, TWILIO_UPLIFT_NUMBER)' };
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

// ─── Auth ────────────────────────────────────────────────────────

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev / unset — allow
  const got = req.headers.get('authorization');
  return got === `Bearer ${secret}`;
}

// ─── Handler ─────────────────────────────────────────────────────

async function processNudges(): Promise<{ processed: number; sent: number; failed: number; results: Array<Record<string, unknown>> }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('sms_uplift_nudges')
    .select('id, phone, profile_key, day_number')
    .is('sent_at', null)
    .lte('due_at', nowIso)
    .order('due_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    return { processed: 0, sent: 0, failed: 0, results: [{ error: `query failed: ${error.message}` }] };
  }

  if (!due || due.length === 0) {
    return { processed: 0, sent: 0, failed: 0, results: [] };
  }

  let sent = 0;
  let failed = 0;
  const results: Array<Record<string, unknown>> = [];

  for (const row of due) {
    const profile = PROFILES[row.profile_key as string];
    const day = row.day_number as 1 | 2 | 3;

    if (!profile) {
      await supabase
        .from('sms_uplift_nudges')
        .update({ sent_at: new Date().toISOString(), error: `unknown profile_key: ${row.profile_key}` })
        .eq('id', row.id);
      failed++;
      results.push({ id: row.id, status: 'unknown-profile', profile_key: row.profile_key });
      continue;
    }

    let message: string;
    try {
      message = await generateMessage(profile, instructionForDay(day));
    } catch (err: any) {
      message = `Hey ${profile.name} 🤎 Your ${profile.aaronRole} Aaron loves you more than words today and every day. ${CLOSING}`;
      console.error(`[uplift-nudges] Claude failed for ${row.id}:`, err?.message || err);
    }

    const { sid, error: smsErr } = await sendSms(row.phone as string, message);
    if (smsErr) {
      await supabase
        .from('sms_uplift_nudges')
        .update({ sent_at: new Date().toISOString(), message, error: smsErr })
        .eq('id', row.id);
      failed++;
      results.push({ id: row.id, status: 'twilio-error', error: smsErr });
      continue;
    }

    await supabase
      .from('sms_uplift_nudges')
      .update({ sent_at: new Date().toISOString(), message, twilio_sid: sid ?? null, error: null })
      .eq('id', row.id);
    sent++;
    results.push({ id: row.id, status: 'sent', phone: row.phone, day, sid });
  }

  return { processed: due.length, sent, failed, results };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  try {
    const summary = await processNudges();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: any) {
    console.error('[uplift-nudges] fatal:', err);
    return NextResponse.json({ error: err?.message || 'fatal' }, { status: 500 });
  }
}

// Vercel Cron uses GET, but allow POST for manual testing.
export async function POST(req: NextRequest) {
  return GET(req);
}
