// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// GoElev8.ai demo-line inbound call routing (1-888-302-0649).
//
// Flow:
//   STEP 1 — Call arrives. Log ringing row. SMS Aaron.
//   STEP 2 — Ring Aaron 15s with a whisper menu:
//              1 → connect caller through to Aaron
//              2 → SMS text-back + hang up
//              3 → hand off to Vapi assistant (outbound callback)
//            Any other / silent → bridge to Aaron normally.
//   STEP 3 — If Aaron doesn't answer within 15s → SMS text-back (Vapi is press-3 only).
//   STEP 4 — Every terminal state updated in Supabase `calls` table.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isOptedOut, withOptOutNotice } from '@/lib/sms-opt-outs';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_DEMO_NUMBER || process.env.TWILIO_TOLL_FREE || process.env.TWILIO_MASTER_NUMBER || '';
const aaronCell = process.env.AARON_PHONE || process.env.AARON_CELL || process.env.AARON_PERSONAL_CELL || '';
const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
const vapiAssistantId =
  process.env.VAPI_DEMO_ASSISTANT_ID ||
  process.env.VAPI_ASSISTANT_ID ||
  process.env.VAPI_LEV_ASSISTANT_ID ||
  'cd0460b5-e1d0-4693-b842-93d68ddf628e';
const vapiApiKey = process.env.VAPI_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';
const CLIENT_SLUG = 'goelev8';

type CallStatus = 'ringing' | 'answered-by-aaron' | 'routed-to-vapi' | 'sms-sent' | 'missed';

function twiml(xml: string) {
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  if (raw.startsWith('+')) return raw;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Set `internal: true` for operator pings (e.g. "you have an incoming call")
// sent to Aaron's cell. Internal pings skip the opt-out gate and skip the
// STOP reminder append. Anything sent to a caller MUST use internal: false.
async function sendSms(to: string, body: string, opts: { internal?: boolean } = {}) {
  if (!twilioAccountSid || !twilioAuthToken || !twilioNumber) return;
  if (!opts.internal) {
    try {
      if (await isOptedOut(supa(), to)) {
        console.log('[inbound] skipped SMS to opted-out number', to);
        return;
      }
    } catch (err) {
      console.error('[inbound] opt-out check failed (proceeding anyway):', err);
    }
  }
  const finalBody = opts.internal ? body : withOptOutNotice(body);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: twilioNumber, Body: finalBody }),
  });
}

function supa() {
  return createClient(supabaseUrl, supabaseKey);
}

async function insertRinging(callSid: string, callerNumber: string) {
  try {
    await supa().from('calls').insert({
      call_sid: callSid,
      caller_number: callerNumber,
      client_slug: CLIENT_SLUG,
      status: 'ringing' satisfies CallStatus,
    });
  } catch (err) {
    console.error('[inbound] insertRinging failed:', err);
  }
}

async function updateCall(callSid: string, patch: Record<string, unknown>) {
  try {
    await supa().from('calls').update({ ...patch, updated_at: new Date().toISOString() }).eq('call_sid', callSid);
  } catch (err) {
    console.error('[inbound] updateCall failed:', err);
  }
}

async function getCallStatus(callSid: string): Promise<CallStatus | null> {
  try {
    const { data } = await supa().from('calls').select('status').eq('call_sid', callSid).maybeSingle();
    return (data?.status as CallStatus) ?? null;
  } catch {
    return null;
  }
}

async function startVapiCallback(callerNumber: string) {
  if (!vapiApiKey || !vapiAssistantId || !vapiPhoneNumberId) return false;
  try {
    const res = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: vapiAssistantId,
        phoneNumberId: vapiPhoneNumberId,
        customer: { number: toE164(callerNumber) },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[inbound] Vapi callback failed:', err);
    return false;
  }
}

// ── Entry: POST /api/calls/inbound ──
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const step = url.searchParams.get('step');

  if (step === 'whisper')        return handleWhisper(req);
  if (step === 'whisper-action') return handleWhisperAction(req);
  if (step === 'dial-result')    return handleDialResult(req);

  return handleIncoming(req);
}

// STEP 1 — Twilio hits this when a call arrives on the toll-free number
async function handleIncoming(req: NextRequest) {
  const formData = await req.formData();
  const callerNumber = (formData.get('From') as string) || '';
  const callSid = (formData.get('CallSid') as string) || '';

  // Fire-and-forget so Twilio doesn't time out on our response
  insertRinging(callSid, callerNumber).catch(() => {});
  if (aaronCell) {
    sendSms(aaronCell, `📞 Incoming GoElev8 call from ${callerNumber}`, { internal: true }).catch(() => {});
  }

  // Query params for downstream action callbacks
  const qs = `callSid=${encodeURIComponent(callSid)}&caller=${encodeURIComponent(callerNumber)}`;
  const whisperUrl = `${APP_URL}/api/calls/inbound?step=whisper&${qs}`;
  const dialActionUrl = `${APP_URL}/api/calls/inbound?step=dial-result&${qs}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="15" action="${dialActionUrl}" callerId="${twilioNumber}" answerOnBridge="true">
    <Number url="${whisperUrl}">${aaronCell}</Number>
  </Dial>
</Response>`;
  return twiml(xml);
}

// STEP 2 — Whisper played to Aaron's leg only, before bridging
async function handleWhisper(req: NextRequest) {
  const url = new URL(req.url);
  const callSid = url.searchParams.get('callSid') || '';
  const caller = url.searchParams.get('caller') || '';
  const actionUrl = `${APP_URL}/api/calls/inbound?step=whisper-action&callSid=${encodeURIComponent(callSid)}&caller=${encodeURIComponent(caller)}`;

  // numDigits=1: first keypress triggers the action URL. timeout=5: if Aaron says nothing, fall through to bridge.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="5" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna">GoElev8 demo call from ${caller.replace(/\D/g, '').split('').join(' ')}. Press 1 to connect. Press 2 to send an auto SMS and hang up. Press 3 for the AI assistant. Stay silent to connect normally.</Say>
  </Gather>
</Response>`;
  return twiml(xml);
}

// STEP 2b — Aaron pressed a digit on the whisper menu
async function handleWhisperAction(req: NextRequest) {
  const url = new URL(req.url);
  const callSid = url.searchParams.get('callSid') || '';
  const caller = url.searchParams.get('caller') || '';
  const formData = await req.formData();
  const digit = (formData.get('Digits') as string) || '';

  // 1 → connect Aaron through normally. Empty TwiML = Gather finishes, Dial bridges.
  if (digit === '1') {
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  // 2 → auto SMS text-back, hang up Aaron; dial-result sees sms-sent and hangs up the caller.
  if (digit === '2') {
    await updateCall(callSid, { status: 'sms-sent', text_back_sent: true });
    sendSms(
      caller,
      "Hey! Sorry we missed your call at GoElev8.ai. How can we help? Reply to this text and we'll get right back to you. - GoElev8.ai Team"
    ).catch(() => {});
    if (aaronCell) sendSms(aaronCell, `📱 Text-back sent to ${caller}`, { internal: true }).catch(() => {});
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Text back sent.</Say><Hangup/></Response>`);
  }

  // 3 → hand off to Vapi via outbound callback. Aaron's leg hangs up; dial-result sees routed-to-vapi.
  if (digit === '3') {
    await updateCall(callSid, { status: 'routed-to-vapi', vapi_used: true });
    startVapiCallback(caller).catch(() => {});
    if (aaronCell) sendSms(aaronCell, `✅ Handed off to Vapi — ${caller}`, { internal: true }).catch(() => {});
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Handing off to the AI assistant.</Say><Hangup/></Response>`);
  }

  // Any other digit or timeout with no input: bridge normally.
  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
}

// STEP 3/4 — Twilio calls this when the Dial verb finishes (Aaron's leg ended, or timeout)
async function handleDialResult(req: NextRequest) {
  const url = new URL(req.url);
  const callSid = url.searchParams.get('callSid') || '';
  const caller = url.searchParams.get('caller') || '';
  const formData = await req.formData();
  const dialCallStatus = (formData.get('DialCallStatus') as string) || '';
  const dialCallDuration = parseInt((formData.get('DialCallDuration') as string) || '0', 10);

  const currentStatus = await getCallStatus(callSid);

  // Whisper already routed the call. Just hang up the caller's leg.
  if (currentStatus === 'routed-to-vapi' || currentStatus === 'sms-sent') {
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Thanks — we'll be right with you.</Say><Hangup/></Response>`);
  }

  // Aaron bridged normally and the call completed
  if (dialCallStatus === 'completed' && dialCallDuration >= 3) {
    await updateCall(callSid, { status: 'answered-by-aaron', duration: dialCallDuration });
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
  }

  // Aaron didn't answer (no-answer, busy, failed, canceled, or completed <3s) → SMS text-back.
  // Vapi is press-3 only per spec; no auto-handoff on no-answer.
  await sendSms(
    caller,
    "Hey! Sorry we missed your call at GoElev8.ai. How can we help? Reply to this text and we'll get right back to you. - GoElev8.ai Team"
  );
  await updateCall(callSid, { status: 'sms-sent', text_back_sent: true });
  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Sorry we missed you. We just sent you a text.</Say><Hangup/></Response>`);
}

// Twilio always POSTs. GET is only useful for manual health-checks.
export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/calls/inbound' });
}
