// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared logic for the SMS Uplift assistant:
//   - Profile definitions (one per recipient)
//   - Claude prompt building + message generation
//   - Per-day instruction lines for the 3-day nudge cron
//
// Imported by both /api/sms-uplift (inbound webhook) and
// /api/cron/uplift-nudges (daily nudge sender).

import Anthropic from '@anthropic-ai/sdk';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const CLOSING = '— Aaron 🤎';

export type Profile = {
  name: string;
  relationship: string;     // her relationship TO Aaron
  aaronRole: string;        // Aaron's role TO her — used in messaging
  traits: string[];
  coretruth: string | string[];
  context: string;
  tone: string;
};

// PROFILES is keyed by the SMS keyword that opts the recipient in.
// Note: Barbara's keyword is "mom" (not her name) for sentimentality.
export const PROFILES: Record<string, Profile> = {
  mom: {
    name: 'Barbara',
    relationship: 'mother',
    aaronRole: 'son',
    traits: ['faith-driven', 'strong', 'nurturing', 'sacrificial', 'wise', 'steady'],
    coretruth: [
      'Her faith keeps the family grounded',
      'She sacrificed everything for her kids',
      'She never missed a moment that mattered',
    ],
    context:
      "Barbara is Aaron's mother. She raised her children with deep faith and unconditional love. She showed up for every important moment, gave everything she had for her kids, and her faith has been the anchor of the entire family.",
    tone: 'reverent, warm, deeply honoring — like a son who sees everything she did and is finally saying it out loud',
  },
  courtney: {
    name: 'Courtney',
    relationship: 'wife',
    aaronRole: 'husband',
    traits: ['resilient', 'devoted', 'graceful', 'strong', 'loving', 'patient'],
    coretruth: [
      'She holds the family together quietly',
      'She showed up for Aaron even when it was hard',
    ],
    context:
      "Courtney is Aaron's wife. They've been together since November 30, 2007 and married since May 28, 2016. She is raising two incredible kids — a son and a daughter Riyan (a competitive dancer in hip hop, jazz, and lyrical). She carries so much quietly, holds the household together, and has stood beside Aaron through every season of life.",
    tone: 'romantic, intimate, deeply personal — like a love letter from a husband who sees her fully',
  },
  ashlen: {
    name: 'Ashlen',
    relationship: 'sister',
    aaronRole: 'brother',
    traits: ['strong', 'selfless', 'tough', 'tender', 'fun', 'energetic'],
    coretruth: 'Aaron is immensely proud of the mother and role model Ashlen has become',
    context:
      "Ashlen is Aaron's sister. She is a mother who leads by example for her kids. She shows up for her children consistently, is building a real legacy, and makes Aaron genuinely proud every time he watches her mother.",
    tone: 'proud, brotherly, celebratory — like a brother who has watched his little sister become extraordinary',
  },
  mariah: {
    name: 'Mariah',
    relationship: 'niece',
    aaronRole: 'uncle',
    traits: ['brave', 'resilient', 'loving', 'determined', 'soft-hearted', 'strong'],
    coretruth: 'She is breaking cycles and building something new for her family',
    context:
      "Mariah is Aaron's niece. She is a young mother who got married and is actively building a new chapter for her family. She took on motherhood with courage, married the person she loves, and is creating something generational.",
    tone: "uplifting, affirming, celebratory — like a proud uncle who sees exactly what she's doing and wants her to know it matters",
  },
};

export function ensureClosing(reply: string): string {
  const trimmed = reply.trim();
  if (trimmed.endsWith(CLOSING)) return trimmed;
  const wo = trimmed.replace(/[\s—–-]+$/, '').trim();
  return `${wo} ${CLOSING}`;
}

function buildSystemPrompt(): string {
  return [
    `You write short, warm, personalized SMS messages from Aaron Bryant to a specific woman in his life.`,
    `Each message must be 1 to 2 sentences MAX, written in Aaron's voice in the first person ("I").`,
    `Reference the woman's relationship to Aaron explicitly the first time you address her — e.g. "your son Aaron", "your husband Aaron", "your brother Aaron", "your uncle Aaron" — so it's clear who is sending.`,
    `Two themes must come through somewhere across each message: (1) Aaron loves her sincerely, more than words can express; (2) he loves her exactly as she is, even on days she wants to "bum it out" and not be celebrated.`,
    `Never mention AI, GoElev8.ai, automation, or that this is a system. Never open with "Happy Mother's Day" — be more creative.`,
    `Always close with exactly: "${CLOSING}".`,
  ].join('\n\n');
}

export async function generateMessage(profile: Profile, instructionLine: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const coretruth = Array.isArray(profile.coretruth)
    ? profile.coretruth.join(' | ')
    : profile.coretruth;

  const userPrompt = [
    `Write a short SMS from Aaron to ${profile.name}.`,
    ``,
    `Her relationship to Aaron: ${profile.relationship}`,
    `Aaron's role to her: ${profile.aaronRole} (use "your ${profile.aaronRole} Aaron" once)`,
    `Her traits: ${profile.traits.join(', ')}`,
    `Core truths: ${coretruth}`,
    `Context: ${profile.context}`,
    `Tone: ${profile.tone}`,
    ``,
    instructionLine,
    ``,
    `Hard rule: 1-2 sentences MAX. End with exactly "${CLOSING}".`,
  ].join('\n');

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 220,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  const raw = block && block.type === 'text' ? block.text : '';
  return ensureClosing(raw);
}

// First-touch instruction for the immediate opt-in reply (when someone
// texts the keyword in). Heartfelt and personal — but still 1-2 sentences.
export function instructionForOptIn(): string {
  return `She just texted in for the first time. Make it heartfelt and personal — open in Aaron's voice with how much he loves her, woven into the moment. This is the message she'll save and re-read; make it land.`;
}

// Day-themed instruction line for the 3-day nudge cron.
export function instructionForDay(day: 1 | 2 | 3): string {
  if (day === 1) {
    return `Lead with the depth of Aaron's love — that words don't quite capture how much he loves her. Make her feel sincerely cherished.`;
  }
  if (day === 2) {
    return `Lead with permission — let her know it's okay if she wants to bum it out today and skip the fuss; Aaron loves her exactly as she is in any mood.`;
  }
  return `Wrap up the three-day arc — blend both themes (love beyond words + accepting any mood). Make her feel seen, full stop.`;
}

export function instructionForDown(): string {
  return `She just texted that she's feeling down/low/tired/off. Acknowledge it briefly without being preachy or trying to fix it. Tell her Aaron loves her exactly as she is right now, no need to perform.`;
}
