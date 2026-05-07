// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// HushSTL demo: capture phone from the goelev8.ai/hush "Join the list" form,
// send a welcome SMS via Twilio, log to demo_leads.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const WELCOME_BODY =
  "You're on the HUSH list. Tickets to HUSH at Skybar (Moonrise Hotel): https://posh.vip/e/hush-skybar-at-moonrise-hotel\n\nQuestions? Call this number. Reply STOP to opt out.";

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function sendTwilioSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MASTER_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[hush/join] Twilio env vars missing');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[hush/join] Twilio error:', res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[hush/join] Twilio fetch error:', err);
    return false;
  }
}

async function logDemoLead(data: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('demo_leads').insert(data);
  } catch (err) {
    console.error('[hush/join] Log error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json({ error: 'Enter a valid US number' }, { status: 400 });
    }

    const sent = await sendTwilioSms(normalized, WELCOME_BODY);

    await logDemoLead({
      industry: 'hush',
      phone_number: normalized,
      generated_script: WELCOME_BODY,
      sms_sent: sent,
      sms_sent_at: sent ? new Date().toISOString() : null,
      source: 'hush',
      error: sent ? null : 'Twilio send failed',
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Couldn't send right now. Try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[hush/join] Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
