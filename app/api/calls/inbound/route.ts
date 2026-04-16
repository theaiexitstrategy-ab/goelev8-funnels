// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
// Twilio webhook handler for inbound calls to the GoElev8.ai toll-free number.
//
// Flow:
// 1. Inbound call → SMS Aaron's cell + ring Aaron for 15s
// 2. Aaron answers → connect call, log answered_by: 'aaron'
// 3. Aaron declines (< 3s pickup or canceled) → SMS text-back to caller, skip Vapi
// 4. Aaron doesn't answer (15s) → route to Vapi assistant
// 5. Vapi doesn't engage → fire missed call text-back

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_MASTER_NUMBER!;
const aaronCell = process.env.AARON_PERSONAL_CELL!;
const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function twiml(xml: string) {
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function sendSms(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: twilioNumber,
      Body: body,
    }),
  });
}

async function logCall(data: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('calls').insert({
      ...data,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[inbound] Failed to log call:', err);
  }
}

// Main inbound call webhook — Twilio hits this when a call comes in
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callerNumber = formData.get('From') as string || '';
  const callSid = formData.get('CallSid') as string || '';
  const timestamp = new Date().toISOString();

  // SMS Aaron with incoming call notification
  sendSms(
    aaronCell,
    `📞 Incoming call — ${callerNumber} — GoElev8 line — ${timestamp}`
  ).catch(err => console.error('[inbound] SMS notification failed:', err));

  // TwiML: ring Aaron for 15 seconds, then handle based on result
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="15" action="${appUrl}/api/calls/inbound?step=dial-result&amp;caller=${encodeURIComponent(callerNumber)}&amp;callSid=${encodeURIComponent(callSid)}" callerId="${twilioNumber}">
    <Number>${aaronCell}</Number>
  </Dial>
</Response>`;

  return twiml(xml);
}

// Handle dial result callback
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const step = url.searchParams.get('step');

  if (step === 'dial-result') {
    return handleDialResult(req);
  }

  return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
}

async function handleDialResult(req: NextRequest) {
  const url = new URL(req.url);
  const callerNumber = url.searchParams.get('caller') || '';
  const callSid = url.searchParams.get('callSid') || '';

  // Parse Twilio's dial result from the request body
  const formData = await req.formData();
  const dialCallStatus = formData.get('DialCallStatus') as string || '';
  const dialCallDuration = parseInt(formData.get('DialCallDuration') as string || '0', 10);

  if (dialCallStatus === 'completed') {
    // Aaron answered and call completed normally
    await logCall({
      caller_number: callerNumber,
      call_sid: callSid,
      answered_by: 'aaron',
      duration: dialCallDuration,
      text_back_sent: false,
      vapi_used: false,
    });

    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
  }

  if (dialCallStatus === 'canceled' || (dialCallStatus === 'completed' && dialCallDuration < 3)) {
    // Aaron declined — send SMS text-back, skip Vapi
    await sendSms(
      callerNumber,
      "Hey! Sorry I missed your call — I'm with a client right now. What can I help you with? Reply here and I'll get back to you shortly. — Aaron, GoElev8.ai"
    );

    // Notify Aaron
    await sendSms(
      aaronCell,
      `📱 You declined — text-back sent to ${callerNumber}. Reply when ready.`
    );

    await logCall({
      caller_number: callerNumber,
      call_sid: callSid,
      answered_by: 'declined-sms',
      text_back_sent: true,
      vapi_used: false,
    });

    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
  }

  // Aaron didn't answer (no-answer, busy, failed) — route to Vapi
  if (vapiAssistantId && vapiPhoneNumberId) {
    try {
      const vapiKey = process.env.VAPI_API_KEY;
      if (vapiKey) {
        // Transfer to Vapi by making an outbound call from Vapi to the caller
        const digits = callerNumber.replace(/\D/g, '');
        const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

        await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vapiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId: vapiAssistantId,
            phoneNumberId: vapiPhoneNumberId,
            customer: { number: e164 },
          }),
        });

        await logCall({
          caller_number: callerNumber,
          call_sid: callSid,
          answered_by: 'vapi',
          text_back_sent: false,
          vapi_used: true,
        });

        return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Please hold while we connect you with our assistant.</Say><Pause length="30"/></Response>`);
      }
    } catch (err) {
      console.error('[inbound] Vapi routing failed:', err);
    }
  }

  // Vapi not available or failed — fire missed call text-back
  await sendSms(
    callerNumber,
    "Hey! Sorry we missed your call. We'd love to help — what can we assist you with today? Reply here and we'll get right back to you. — GoElev8.ai"
  );

  await logCall({
    caller_number: callerNumber,
    call_sid: callSid,
    answered_by: 'missed',
    text_back_sent: true,
    vapi_used: false,
  });

  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
}
