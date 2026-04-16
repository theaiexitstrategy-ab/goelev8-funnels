// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { phone, script, business_name } = await req.json();

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const vapiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!vapiKey || !assistantId || !phoneNumberId) {
      return NextResponse.json({ error: 'Voice demo not configured' }, { status: 503 });
    }

    // Format phone number to E.164
    const digits = phone.replace(/\D/g, '');
    const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: {
          number: e164,
        },
        assistantOverrides: {
          firstMessage: script || `Hi, thanks for reaching out to ${business_name || 'us'}. I wanted to make sure we connected — what can I help you with today?`,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[trigger-call] Vapi error:', errorData);
      return NextResponse.json({ error: 'Failed to initiate call' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, callId: data.id });
  } catch (err) {
    console.error('[trigger-call] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
