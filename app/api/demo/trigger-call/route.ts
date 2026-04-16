// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Trigger an outbound Vapi call for the hero-section Vapi strip.
// Uses the Lev assistant. Logs each demo call to demo_leads.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function logDemoLead(data: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('demo_leads').insert(data);
  } catch (err) {
    console.error('[trigger-call] Log error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, script, business_name } = await req.json();

    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json({ error: 'Enter a valid US number' }, { status: 400 });
    }

    const vapiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_LEV_ASSISTANT_ID || process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!vapiKey || !assistantId || !phoneNumberId) {
      await logDemoLead({
        phone_number: normalized,
        sms_sent: false,
        vapi_call: false,
        source: 'vapi-strip',
        error: 'Vapi not configured',
      });
      return NextResponse.json({ error: 'Voice demo not configured' }, { status: 503 });
    }

    const body: Record<string, unknown> = {
      assistantId,
      phoneNumberId,
      customer: { number: normalized },
    };

    if (script) {
      body.assistantOverrides = {
        firstMessage: script.replace(/\[name\]/g, business_name || 'us'),
      };
    }

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[trigger-call] Vapi error:', response.status, errorData);

      await logDemoLead({
        phone_number: normalized,
        sms_sent: false,
        vapi_call: false,
        source: 'vapi-strip',
        error: `Vapi ${response.status}`,
      });

      return NextResponse.json({ error: 'Failed to initiate call' }, { status: 502 });
    }

    const data = await response.json();

    await logDemoLead({
      phone_number: normalized,
      sms_sent: false,
      vapi_call: true,
      vapi_call_id: data.id || null,
      source: 'vapi-strip',
    });

    return NextResponse.json({ success: true, callId: data.id });
  } catch (err) {
    console.error('[trigger-call] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
