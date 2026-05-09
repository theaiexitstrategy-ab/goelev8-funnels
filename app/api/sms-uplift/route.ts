// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Mother's Day SMS Uplift Assistant — Vapi inbound SMS webhook.
// A woman texts her name to +1 (888) 814-6142, we look up her profile,
// generate a personalized message via Claude, and send it back via Vapi.
//
// Returns { reply: "..." } per the Vapi SMS webhook contract.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ─── Config ──────────────────────────────────────────────────────

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const RATE_LIMIT_PER_HOUR = 3;
const CLOSING = '— Sent with love 🤎';

// ─── Profiles ────────────────────────────────────────────────────

type Profile = {
  name: string;
  relationship: string;
  traits: string[];
  coretruth: string | string[];
  context: string;
  tone: string;
};

const PROFILES: Record<string, Profile> = {
  barbara: {
    name: 'Barbara',
    relationship: 'mother',
    traits: ['faith-driven', 'strong', 'nurturing', 'sacrificial', 'wise', 'steady'],
    coretruth: [
      'Her faith keeps the family grounded',
      'She sacrificed everything for her kids',
      'She never missed a moment that mattered',
    ],
    context:
      "Barbara is Aaron's mother. She raised her children with deep faith and unconditional love. She showed up for every important moment, gave everything she had for her kids, and her faith has been the anchor of the entire family. She is the foundation.",
    tone: 'reverent, warm, deeply honoring — like a son who sees everything she did and is finally saying it out loud',
  },
  courtney: {
    name: 'Courtney',
    relationship: 'wife',
    traits: ['resilient', 'devoted', 'graceful', 'strong', 'loving', 'patient'],
    coretruth: [
      'She holds the family together quietly',
      'She showed up for Aaron even when it was hard',
    ],
    context:
      "Courtney is Aaron's wife. They've been together since November 30, 2007 and married since May 28, 2016. She is raising two incredible kids — a son (junior, works at McDonald's) and a daughter Riyan (junior, competitive dancer in hip hop, jazz, and lyrical). She carries so much quietly, holds the household together, and has stood beside Aaron through every season of life — including his entrepreneurial journey building GoElev8.ai.",
    tone: 'romantic, intimate, deeply personal — like a love letter from a husband who sees her fully',
  },
  ashlen: {
    name: 'Ashlen',
    relationship: 'sister',
    traits: ['strong', 'selfless', 'tough', 'tender', 'fun', 'energetic'],
    coretruth: 'Aaron is immensely proud of the mother and role model Ashlen has become',
    context:
      "Ashlen is Aaron's sister. She is a mother who leads by example for her kids. Aaron sees her as someone who shows up for her children consistently, is building a real legacy, and makes him genuinely proud every time he watches her mother. She's tough when she needs to be and tender when it counts.",
    tone: 'proud, brotherly, celebratory — like a brother who has watched his little sister become extraordinary',
  },
  mariah: {
    name: 'Mariah',
    relationship: 'niece',
    traits: ['brave', 'resilient', 'loving', 'determined', 'soft-hearted', 'strong'],
    coretruth: 'She is breaking cycles and building something new for her family',
    context:
      "Mariah is Aaron's niece. She is a young mother who got married and is actively building a new chapter for her family. She took on motherhood with courage, married the person she loves, and is creating something generational. She is breaking old patterns and laying a new foundation — and that deserves to be celebrated loudly.",
    tone: "uplifting, affirming, celebratory — like a proud uncle who sees exactly what she's doing and wants her to know it matters",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────

// Pull message text + sender from a Vapi (or Twilio-shaped) inbound payload.
// Vapi's SMS webhook format isn't perfectly standardized in our codebase yet,
// so we accept several shapes and try them in order.
function extractInbound(body: any): { text: string; from: string } {
  const text =
    body?.message ??
    body?.text ??
    body?.body ??
    body?.Body ??
    body?.message?.content ??
    body?.message?.body ??
    body?.payload?.message ??
    body?.payload?.text ??
    '';
  const from =
    body?.from ??
    body?.From ??
    body?.phone ??
    body?.phoneNumber ??
    body?.message?.from ??
    body?.message?.phoneNumber ??
    body?.payload?.from ??
    '';
  return { text: String(text || '').trim(), from: String(from || '').trim() };
}

function matchProfile(text: string): { key: string; profile: Profile } | null {
  if (!text) return null;
  const norm = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  // 1) Exact / single-word match.
  const single = norm.trim();
  if (PROFILES[single]) return { key: single, profile: PROFILES[single] };

  // 2) "Hey it's Barbara" — first known name found in the text.
  const tokens = norm.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (PROFILES[tok]) return { key: tok, profile: PROFILES[tok] };
  }
  return null;
}

function ensureClosing(reply: string): string {
  const trimmed = reply.trim();
  if (trimmed.endsWith(CLOSING)) return trimmed;
  // If Claude closed with an em-dash variant, normalize.
  const woTrailingEm = trimmed.replace(/[\s—–-]+$/, '').trim();
  return `${woTrailingEm}\n\n${CLOSING}`;
}

const FALLBACK_REPLY =
  `Hey beautiful 🤎 We don't have a personalized message set up for that name yet — but know that you are seen, you are valued, and you are more than enough. Keep going. ${CLOSING}`;

const RATE_LIMITED_REPLY =
  `Hey 🤎 You've already received a few messages from us recently — give it about an hour and try again. We don't want to overwhelm your phone. ${CLOSING}`;

// ─── Main handler ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, from } = extractInbound(body);

  if (!from) {
    return NextResponse.json({ error: 'Missing sender' }, { status: 400 });
  }

  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  const matched = matchProfile(text);

  // ── Rate limit: 3 messages per phone per hour ──
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
          phone: from,
          name_received: text,
          matched: !!matched,
          matched_profile: matched?.key ?? null,
          message_sent: null,
          rate_limited: true,
        });
        return NextResponse.json({ reply: RATE_LIMITED_REPLY });
      }
    } catch (err) {
      console.error('[sms-uplift] rate-limit check failed:', err);
      // Fall through — never let a Supabase hiccup block a real reply.
    }
  }

  // ── Generate the reply ──
  let replyText = FALLBACK_REPLY;
  if (matched) {
    try {
      replyText = await generateUpliftMessage(matched.profile);
    } catch (err) {
      console.error('[sms-uplift] Claude generation failed:', err);
      // Still send something warm rather than nothing.
      replyText = `Hey ${matched.profile.name} 🤎 You are seen, you are loved, and you are more than enough today. ${CLOSING}`;
    }
  }

  // ── Log + return ──
  if (supabase) {
    try {
      await supabase.from('sms_uplift_log').insert({
        phone: from,
        name_received: text,
        matched: !!matched,
        matched_profile: matched?.key ?? null,
        message_sent: replyText,
        rate_limited: false,
      });
    } catch (err) {
      console.error('[sms-uplift] log insert failed:', err);
    }
  }

  return NextResponse.json({ reply: replyText });
}

async function generateUpliftMessage(profile: Profile): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const coretruth = Array.isArray(profile.coretruth)
    ? profile.coretruth.join(' | ')
    : profile.coretruth;

  const userPrompt = [
    `Generate a personalized uplifting message for ${profile.name}.`,
    '',
    `Her relationship to Aaron: ${profile.relationship}`,
    `Her traits: ${profile.traits.join(', ')}`,
    `Core truths about her: ${coretruth}`,
    `Context: ${profile.context}`,
    `Tone: ${profile.tone}`,
    '',
    `Write ONE message. 3-5 sentences. End with "${CLOSING}". Make it feel real, personal, and powerful.`,
  ].join('\n');

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 400,
    system:
      `You are a warm, emotionally intelligent uplift assistant created by Aaron Bryant of GoElev8.ai as a Mother's Day gift for the special women in his life. ` +
      `Generate one beautiful, personalized, uplifting message — 3 to 5 sentences. ` +
      `It must feel like it came from someone who truly knows her — never generic. ` +
      `Reference specific truths about who she is. End with an affirmation she can carry with her. ` +
      `NEVER mention AI, GoElev8.ai, automation, or that this is a system. ` +
      `NEVER open with "Happy Mother's Day". ` +
      `Always close with exactly: "${CLOSING}".`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  const raw = block && block.type === 'text' ? block.text : '';
  return ensureClosing(raw);
}
