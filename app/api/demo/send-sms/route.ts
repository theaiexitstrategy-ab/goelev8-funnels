// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hero-section demo: generate personalized SMS via Claude, send via Twilio, log to demo_leads.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_MESSAGES: Record<string, string> = {
  gym: "Hey! Missed your call — this is the GoElev8 demo. What fitness goal are you working toward? 💪",
  medspa: "Hi! Missed your call — GoElev8 demo here. What treatment were you looking into? ✨",
  hvac: "Hey! Missed your call — GoElev8 demo. Is this urgent or scheduling routine service? 🔧",
  realestate: "Hi! Missed your call — GoElev8 demo. Are you buying, selling, or just exploring? 🏡",
  insurance: "Hey! Missed your call — GoElev8 demo. Looking to review coverage or explore new options? 🛡️",
  studio: "Hey! Missed your call — GoElev8 demo. Looking to book time or discuss a project? 🎙️",
  law: "Hi! Missed your call — GoElev8 demo. What legal matter can we help you with today? ⚖️",
  other: "Hey! Missed your call — GoElev8 demo. What can we help you with today? ⚡",
};

const INDUSTRY_LABELS: Record<string, string> = {
  gym: 'gym / fitness studio',
  medspa: 'med spa / aesthetics clinic',
  hvac: 'HVAC / home services company',
  realestate: 'real estate agency',
  insurance: 'insurance / financial planning firm',
  studio: 'recording / music studio',
  law: 'law firm',
  other: 'local service business',
};

const SIGNATURE = '\n\n— Powered by GoElev8.ai\nbook.goelev8.ai';

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function generateScript(industry: string): Promise<{ script: string; fallback: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = FALLBACK_MESSAGES[industry] || FALLBACK_MESSAGES.other;

  if (!apiKey) return { script: fallback, fallback: true };

  try {
    const client = new Anthropic({ apiKey });
    const label = INDUSTRY_LABELS[industry] || INDUSTRY_LABELS.other;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Write a single warm personalized SMS text-back message for a ${label}. The message should sound like it just came from the business's AI assistant after a missed call. Ask one qualifying question relevant to that industry. Under 35 words. Conversational. No emojis except one at the end. Return ONLY the message text, nothing else.`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    if (!text) return { script: fallback, fallback: true };

    return { script: text, fallback: false };
  } catch (err) {
    console.error('[send-sms] Claude error:', err);
    return { script: fallback, fallback: true };
  }
}

async function sendTwilioSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MASTER_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[send-sms] Twilio env vars missing');
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
      console.error('[send-sms] Twilio error:', res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[send-sms] Twilio fetch error:', err);
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
    console.error('[send-sms] Log error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { industry, phone } = await req.json();

    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json({ error: 'Enter a valid US number' }, { status: 400 });
    }

    const ind = (industry || 'other').toLowerCase();

    // Generate the SMS
    const { script } = await generateScript(ind);
    const fullBody = script + SIGNATURE;

    // Send via Twilio
    const sent = await sendTwilioSms(normalized, fullBody);

    // Log to Supabase
    await logDemoLead({
      industry: ind,
      phone_number: normalized,
      generated_script: script,
      sms_sent: sent,
      sms_sent_at: sent ? new Date().toISOString() : null,
      source: 'hero',
      error: sent ? null : 'Twilio send failed',
    });

    if (!sent) {
      return NextResponse.json({ error: "Couldn't send right now. Try again in a moment." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-sms] Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
