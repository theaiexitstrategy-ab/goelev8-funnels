// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush inbound SMS webhook. Twilio POSTs every text sent to the Hush
// shared number here.
//
// Flow:
//   1. Verify Twilio signature with TWILIO_AUTH_TOKEN.
//   2. Parse Body / From / To / MessageSid.
//   3. Match the keyword against hush_keywords (case-insensitive,
//      active only). If a match is found, increment used_count and
//      build the AI reply + booking link.
//   4. Auto-create a hush_contacts row for the From number under the
//      matched promoter (so the guest list builds itself).
//   5. Log inbound + outbound to hush_messages.
//   6. Respond with TwiML.
//
// Fallback: if no keyword matches, we ship the legacy HUSH-Skybar
// reply so the live demo stays unbroken while we onboard real
// promoters into the system.

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const FALLBACK_REPLY =
  "HUSH at Skybar (Moonrise Hotel) — grab tickets here: https://posh.vip/e/hush-skybar-at-moonrise-hotel\n\nQuestions? Call this number. Reply STOP to opt out.";

const UNKNOWN_REPLY =
  "Thanks — we got your text. Reply with a valid keyword to claim your spot.\n\nReply STOP to opt out.";

function twiml(message: string): Response {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

// Twilio signature: HMAC-SHA1 of (full-URL + sorted-params-concatenated),
// base64-encoded. Verifies the request actually came from Twilio.
function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const sorted = Object.keys(params).sort();
  const data = url + sorted.map((k) => k + params[k]).join('');
  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  // Constant-time compare
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[hush/sms] Supabase service role env vars missing — DB ops will be skipped');
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('[hush/sms] TWILIO_AUTH_TOKEN missing');
    return twiml(FALLBACK_REPLY);
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string') params[key] = value;
  });

  const body = (params.Body ?? '').trim();
  const from = (params.From ?? '').trim();
  const to = (params.To ?? '').trim();
  const messageSid = params.MessageSid;

  // Reconstruct the URL Twilio used to sign the request. Vercel terminates
  // TLS so x-forwarded-proto/x-forwarded-host are authoritative.
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const url = `${proto}://${host}${req.nextUrl.pathname}`;
  const signature = req.headers.get('x-twilio-signature') ?? '';

  if (!signature || !verifyTwilioSignature(authToken, signature, url, params)) {
    console.warn('[hush/sms] Invalid Twilio signature', { url, from });
    return new Response('Forbidden', { status: 403 });
  }

  if (!body || !from || !to) {
    return twiml(UNKNOWN_REPLY);
  }

  const supabase = admin();
  const keywordText = body.toUpperCase().split(/\s+/)[0];

  let replyText: string;
  let promoterId: string | null = null;
  let keywordId: string | null = null;
  let matched = false;

  // Try to match the keyword against the DB. Wrapped in try/catch so
  // any DB error (missing service-role key, RLS reject, network blip)
  // never breaks the webhook — Twilio always gets valid TwiML.
  let keyword:
    | {
        id: string;
        promoter_id: string;
        keyword: string;
        tier: string;
        price: number;
        booking_url: string;
        ai_reply: string;
        is_active: boolean;
      }
    | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hush_keywords')
        .select('id, promoter_id, keyword, tier, price, booking_url, ai_reply, is_active')
        .ilike('keyword', keywordText)
        .eq('is_active', true)
        .maybeSingle();
      if (error) {
        console.error('[hush/sms] keyword lookup failed:', error.message);
      } else {
        keyword = data;
      }
    } catch (err) {
      console.error('[hush/sms] keyword lookup threw:', err);
    }
  }

  if (keyword) {
    matched = true;
    keywordId = keyword.id;
    promoterId = keyword.promoter_id;
    replyText = `${keyword.ai_reply}\n\n${keyword.booking_url}`;

    // Increment used_count and auto-build the contact list. Best-effort —
    // failures here don't change the reply.
    if (supabase) {
      try {
        const { data: latest } = await supabase
          .from('hush_keywords')
          .select('used_count')
          .eq('id', keyword.id)
          .single();
        if (latest) {
          await supabase
            .from('hush_keywords')
            .update({ used_count: (latest.used_count ?? 0) + 1 })
            .eq('id', keyword.id);
        }
      } catch (err) {
        console.error('[hush/sms] used_count increment failed:', err);
      }

      if (promoterId) {
        try {
          const { data: existing } = await supabase
            .from('hush_contacts')
            .select('id')
            .eq('promoter_id', promoterId)
            .eq('phone', from)
            .maybeSingle();
          if (!existing) {
            await supabase.from('hush_contacts').insert({
              promoter_id: promoterId,
              name: from,
              phone: from,
              tier: 'new',
              source: 'hush_signup',
            });
          }
        } catch (err) {
          console.error('[hush/sms] contact upsert failed:', err);
        }
      }
    }
  } else if (keywordText === 'STOP' || keywordText === 'UNSUBSCRIBE') {
    replyText = "You're unsubscribed. Reply START to opt back in.";
  } else if (keywordText === 'HUSH') {
    // Demo fallback — keeps the live HUSH demo working until a promoter
    // creates their own HUSH keyword in the DB.
    replyText = FALLBACK_REPLY;
  } else {
    replyText = UNKNOWN_REPLY;
  }

  // Log both directions to hush_messages. Best-effort — silent skip if
  // the service role isn't configured.
  if (supabase) {
    try {
      await supabase.from('hush_messages').insert([
        {
          promoter_id: promoterId,
          keyword_id: keywordId,
          twilio_sid: messageSid,
          from_phone: from,
          to_phone: to,
          body,
          direction: 'inbound',
          matched,
        },
        {
          promoter_id: promoterId,
          keyword_id: keywordId,
          from_phone: to,
          to_phone: from,
          body: replyText,
          direction: 'outbound',
          matched,
        },
      ]);
    } catch (err) {
      console.error('[hush/sms] message log failed:', err);
    }
  }

  return twiml(replyText);
}
