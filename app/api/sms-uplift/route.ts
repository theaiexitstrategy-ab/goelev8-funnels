// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// SMS Uplift Assistant — inbound webhook + 3-day nudge enrollment.
//
// Wired to Twilio's Messaging webhook on +1 (888) 814-6142. Inbound flows:
//
//   1. Keyword opt-in: text "mom", "courtney", "ashlen", or "mariah" (or a
//      sentence containing one) → match profile, schedule three daily nudges
//      starting tomorrow at 9 AM CDT, reply with a short personalized
//      acknowledgement.
//
//   2. "Feeling down" check-in: text "down", "sad", "rough", "bummed",
//      "tired", "low", "bad day" — we look up the sender's profile by phone
//      (from previous opt-ins) and reply with a short personalized uplift.
//
//   3. Anything else → warm fallback.
//
// Twilio sends application/x-www-form-urlencoded and expects TwiML back.
// JSON callers (Vapi or direct) get { reply } JSON.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  PROFILES,
  type Profile,
  CLOSING,
  generateMessage,
  instructionForDown,
  instructionForOptIn,
  canonicalProfileKey,
} from '@/lib/sms-uplift';

// ─── Config ──────────────────────────────────────────────────────

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const RATE_LIMIT_PER_HOUR = 3;
// 14:00 UTC = 9:00 AM CDT during DST (which we are in for Mother's Day week
// 2026 — May 9–13). For year-round accuracy a TZ library would be needed.
const NUDGE_HOUR_UTC = 14;

// ─── Intent helpers ──────────────────────────────────────────────

function extractInbound(body: any): { text: string; from: string } {
  const text =
    body?.message ?? body?.text ?? body?.body ?? body?.Body ??
    body?.message?.content ?? body?.message?.body ??
    body?.payload?.message ?? body?.payload?.text ?? '';
  const from =
    body?.from ?? body?.From ?? body?.phone ?? body?.phoneNumber ??
    body?.message?.from ?? body?.message?.phoneNumber ??
    body?.payload?.from ?? '';
  return { text: String(text || '').trim(), from: String(from || '').trim() };
}

// Map of every keyword the inbound SMS might contain (lowercased) to a
// canonical profile key. Includes both the canonical keys themselves and
// any legacy aliases (e.g. "mom" → "barbara") so old keywords still work.
const KEYWORDS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const k of Object.keys(PROFILES)) map[k] = k;
  map['mom'] = 'barbara'; // legacy alias from earlier version
  return map;
})();

function matchProfile(text: string): { key: string; profile: Profile } | null {
  if (!text) return null;
  const norm = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  const single = norm.trim();
  if (KEYWORDS[single]) {
    const key = canonicalProfileKey(KEYWORDS[single]);
    return { key, profile: PROFILES[key] };
  }
  for (const tok of norm.split(/\s+/).filter(Boolean)) {
    if (KEYWORDS[tok]) {
      const key = canonicalProfileKey(KEYWORDS[tok]);
      return { key, profile: PROFILES[key] };
    }
  }
  return null;
}

const DOWN_PATTERNS: RegExp[] = [
  /\bdown\b/, /\bsad\b/, /\bbum(?:med|min'?|ing)?\b/, /\btired\b/, /\blow\b/,
  /\brough\b/, /\bstrugg(?:le|ling)\b/, /\bbad day\b/, /\bnot ok(?:ay)?\b/,
  /\boff\b/, /\bdrained\b/,
];
function isDownText(text: string): boolean {
  if (!text) return false;
  const norm = text.toLowerCase();
  return DOWN_PATTERNS.some((re) => re.test(norm));
}

async function getProfileKeyForPhone(supabase: SupabaseClient, phone: string): Promise<string | null> {
  const { data: nudge } = await supabase
    .from('sms_uplift_nudges')
    .select('profile_key')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (nudge?.profile_key) return nudge.profile_key as string;

  const { data: log } = await supabase
    .from('sms_uplift_log')
    .select('matched_profile')
    .eq('phone', phone)
    .eq('matched', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (log?.matched_profile as string | null) ?? null;
}

function nextNudgeTimestamps(): [Date, Date, Date] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), NUDGE_HOUR_UTC, 0, 0, 0));
  // Day 1 is always tomorrow's slot, so opt-ins right before the cron don't
  // get an instant first nudge.
  const day1 = new Date(today);
  day1.setUTCDate(day1.getUTCDate() + 1);
  const day2 = new Date(day1); day2.setUTCDate(day2.getUTCDate() + 1);
  const day3 = new Date(day2); day3.setUTCDate(day3.getUTCDate() + 1);
  return [day1, day2, day3];
}

async function scheduleNudges(supabase: SupabaseClient, phone: string, profileKey: string) {
  const [d1, d2, d3] = nextNudgeTimestamps();
  const rows = [
    { phone, profile_key: profileKey, day_number: 1, due_at: d1.toISOString() },
    { phone, profile_key: profileKey, day_number: 2, due_at: d2.toISOString() },
    { phone, profile_key: profileKey, day_number: 3, due_at: d3.toISOString() },
  ];
  await supabase.from('sms_uplift_nudges').upsert(rows, {
    onConflict: 'phone,profile_key,day_number',
    ignoreDuplicates: true,
  });
}

// ─── Reply text ──────────────────────────────────────────────────

const FALLBACK_REPLY =
  `Hey 🤎 Whoever you are, you are seen, you are valued, and you are loved. Keep going. ${CLOSING}`;

const RATE_LIMITED_REPLY =
  `Easy 🤎 You've gotten a few from us already this hour — give it a bit and try again. ${CLOSING}`;

// Static fallback if Claude fails on the first-touch reply.
function optInFallback(profile: Profile): string {
  return `Hey ${profile.addressAs}, ${profile.fromLine} loves you more than words can say — exactly as you are, today and always. ${CLOSING}`;
}

// ─── Twilio reply helpers ────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function twimlReply(message: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

// ─── Main handler ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  const isTwilio = contentType.includes('application/x-www-form-urlencoded');

  let body: any = {};
  try {
    if (isTwilio) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await req.json();
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { text, from } = extractInbound(body);
  if (!from) {
    if (isTwilio) return twimlReply('Could not read sender — please try again.');
    return NextResponse.json({ error: 'Missing sender' }, { status: 400 });
  }

  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  const matched = matchProfile(text);
  const respond = (msg: string) =>
    isTwilio ? twimlReply(msg) : NextResponse.json({ reply: msg });

  // ── Rate limit ──
  if (supabase) {
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('sms_uplift_log')
        .select('id', { count: 'exact', head: true })
        .eq('phone', from)
        .gte('created_at', since);
      if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
        await supabase.from('sms_uplift_log').insert({
          phone: from, name_received: text, matched: !!matched,
          matched_profile: matched?.key ?? null, message_sent: null, rate_limited: true,
        });
        return respond(RATE_LIMITED_REPLY);
      }
    } catch (err) {
      console.error('[sms-uplift] rate-limit check failed:', err);
    }
  }

  // ── Decide intent ──

  // 1) Keyword match → opt them into the 3-day nudge sequence + send a
  //    heartfelt Claude-generated first-touch message.
  if (matched) {
    let replyText = optInFallback(matched.profile);
    try {
      replyText = await generateMessage(matched.profile, instructionForOptIn());
    } catch (err) {
      console.error('[sms-uplift] opt-in generation failed, using fallback:', err);
    }
    if (supabase) {
      try { await scheduleNudges(supabase, from, matched.key); }
      catch (err) { console.error('[sms-uplift] scheduleNudges failed:', err); }
      try {
        await supabase.from('sms_uplift_log').insert({
          phone: from, name_received: text, matched: true,
          matched_profile: matched.key, message_sent: replyText, rate_limited: false,
        });
      } catch (err) { console.error('[sms-uplift] log insert failed:', err); }
    }
    return respond(replyText);
  }

  // 2) "I'm down today" → look up profile from history, send custom uplift.
  if (isDownText(text) && supabase) {
    const profileKey = await getProfileKeyForPhone(supabase, from);
    const profile = profileKey ? PROFILES[profileKey] : null;
    let replyText = FALLBACK_REPLY;
    if (profile) {
      try { replyText = await generateMessage(profile, instructionForDown()); }
      catch (err) {
        console.error('[sms-uplift] down-message generation failed:', err);
        replyText = `Hey ${profile.addressAs}, ${profile.fromLine} loves you exactly as you are today — no need to perform. ${CLOSING}`;
      }
    }
    try {
      await supabase.from('sms_uplift_log').insert({
        phone: from, name_received: text, matched: !!profile,
        matched_profile: profileKey, message_sent: replyText, rate_limited: false,
      });
    } catch (err) { console.error('[sms-uplift] log insert failed:', err); }
    return respond(replyText);
  }

  // 3) Anything else → warm fallback.
  if (supabase) {
    try {
      await supabase.from('sms_uplift_log').insert({
        phone: from, name_received: text, matched: false,
        matched_profile: null, message_sent: FALLBACK_REPLY, rate_limited: false,
      });
    } catch (err) { console.error('[sms-uplift] log insert failed:', err); }
  }
  return respond(FALLBACK_REPLY);
}
