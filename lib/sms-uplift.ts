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
export const CLOSING = '— Sent with love 🤎';

export type Profile = {
  name: string;
  relationship: string;       // her relationship TO Aaron
  addressAs: string;          // how Aaron opens to her ("Mom" / "Sis" / "Courtney" / "Mariah")
  fromLine: string;           // how Aaron signs off ("your son Aaron" / "Uncle Aaron" / "Aaron")
  traits: string[];
  coretruth: string | string[];
  context: string;
  tone: string;
};

// PROFILES — keyed by the SMS keyword each woman texts in.
export const PROFILES: Record<string, Profile> = {
  barbara: {
    name: 'Barbara',
    relationship: 'mother',
    addressAs: 'Mom',
    fromLine: 'your son Aaron',
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
    addressAs: 'Courtney',
    fromLine: 'Aaron',
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
    addressAs: 'Sis',
    fromLine: 'your brother Aaron',
    traits: ['strong', 'selfless', 'tough', 'tender', 'fun', 'energetic'],
    coretruth: 'Aaron is immensely proud of the mother and role model Ashlen has become',
    context:
      "Ashlen is Aaron's sister. She is a mother who leads by example for her kids. Aaron sees her as someone who shows up for her children consistently, is building a real legacy, and makes him genuinely proud every time he watches her mother. She's tough when she needs to be and tender when it counts.",
    tone: 'proud, brotherly, celebratory — like a brother who has watched his little sister become extraordinary',
  },
  mariah: {
    name: 'Mariah',
    relationship: 'niece',
    addressAs: 'Mariah',
    fromLine: 'Uncle Aaron',
    traits: ['brave', 'resilient', 'loving', 'determined', 'soft-hearted', 'strong'],
    coretruth: 'She is breaking cycles and building something new for her family',
    context:
      "Mariah is Aaron's niece. She is a young mother who got married and is actively building a new chapter for her family. She took on motherhood with courage, married the person she loves, and is creating something generational. She is breaking old patterns and laying a new foundation.",
    tone: 'uplifting, affirming, celebratory — like a proud uncle who sees exactly what she\'s doing and wants her to know it matters',
  },
  toya: {
    name: 'Toya',
    relationship: 'sister-in-law (married to Aaron\'s brother)',
    addressAs: 'Sis',
    fromLine: 'your brother Aaron',
    traits: ['devoted', 'strong', 'loyal', 'nurturing', 'resilient'],
    coretruth: [
      'She holds Aaron\'s brother\'s world together — and it doesn\'t go unnoticed',
      'She is the type of woman the whole family is better because of',
    ],
    context:
      "Toya is the wife of Aaron's brother. She is a mother who shows up every single day for her family. The way she holds his brother's world together is seen, appreciated, and means everything to the family. She is the type of woman our whole family is better because of.",
    tone: 'warm and brotherly — like a brother-in-law who genuinely sees her and wants her to know it',
  },
  tasha: {
    name: 'NaTasha',
    relationship: 'sister-in-law (Courtney\'s sister)',
    addressAs: 'Sis',
    fromLine: 'your brother Aaron',
    traits: ['strong', 'loving', 'quietly powerful', 'devoted', 'underestimated'],
    coretruth: [
      'She is stronger than she gives herself credit for',
      'She shows love in ways people don\'t always say out loud',
    ],
    context:
      "NaTasha is Courtney's sister, making her Aaron's sister-in-law. She is a mother who carries a lot quietly and shows up for her kids and family consistently. Aaron wants her to know she's stronger than she realizes and that her love — even when unspoken — is felt deeply.",
    tone: 'warm, affirming, brotherly — like a brother-in-law who sees how much she carries and wants her to feel celebrated',
  },
};

// Legacy keyword aliases (older opt-in keys we want to keep working).
// "mom" → "barbara". When matching inbound text, we resolve aliases to
// canonical keys before storing or looking up.
const KEYWORD_ALIASES: Record<string, string> = {
  mom: 'barbara',
};

export function canonicalProfileKey(key: string): string {
  return KEYWORD_ALIASES[key] || key;
}

export function ensureClosing(reply: string): string {
  const trimmed = reply.trim();
  if (trimmed.endsWith(CLOSING)) return trimmed;
  const wo = trimmed.replace(/[\s—–-]+$/, '').trim();
  return `${wo}\n\n${CLOSING}`;
}

const SALUTATION_EXAMPLES = '"Hey Mom," / "Hey Sis," / "Courtney," / "Mariah,"';

function buildSystemPrompt(): string {
  return [
    `You are a warm, emotionally intelligent uplift assistant created by Aaron Bryant as a Mother's Day gift for the special women in his life.`,
    `Generate one beautiful, personalized, uplifting SMS message in Aaron's voice (first person "I").`,
    `Open with the salutation given in the prompt — verbatim — e.g. ${SALUTATION_EXAMPLES}. Use the prompt's addressAs value, never her full first name unless addressAs IS her first name.`,
    `Sign Aaron off with the exact "fromLine" given in the prompt (e.g. "your son Aaron", "Aaron", "Uncle Aaron", "your brother Aaron").`,
    `Two themes should be felt across the message: (1) Aaron loves her sincerely, more than words can express; (2) he loves her exactly as she is, even on days she wants to "bum it out" and skip the fuss.`,
    `Never mention AI, GoElev8.ai, automation, or that this is a system. Never open with "Happy Mother's Day" — be more creative.`,
    `Always close the message with exactly: "${CLOSING}".`,
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
    `Write a personalized SMS from Aaron to ${profile.name}.`,
    ``,
    `addressAs (open with this exact salutation, e.g. "Hey ${profile.addressAs}," or "${profile.addressAs},"): ${profile.addressAs}`,
    `fromLine (sign off with this exact phrase): ${profile.fromLine}`,
    ``,
    `Her relationship to Aaron: ${profile.relationship}`,
    `Her traits: ${profile.traits.join(', ')}`,
    `Core truths about her: ${coretruth}`,
    `Context: ${profile.context}`,
    `Tone: ${profile.tone}`,
    ``,
    instructionLine,
    ``,
    `Hard rules:`,
    `- Address her as "${profile.addressAs}" (not her full name) in the opening`,
    `- Sign off as "${profile.fromLine}"`,
    `- 3 to 5 sentences total`,
    `- End with exactly "${CLOSING}"`,
    `- Make it feel real, specific, and powerful — not generic`,
    `- NEVER mention AI, automation, or GoElev8.ai`,
    `- NEVER open with "Happy Mother's Day"`,
  ].join('\n');

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 500,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  const raw = block && block.type === 'text' ? block.text : '';
  return ensureClosing(raw);
}

// First-touch instruction for the immediate opt-in reply.
export function instructionForOptIn(): string {
  return `She just texted in for the first time. Make it heartfelt and personal — open in Aaron's voice, weave in a specific truth about who she is, and let her feel sincerely cherished. This is the message she'll save and re-read.`;
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

// Follow-up instruction when she texts that she's down/sad/tired/off.
export function instructionForDown(): string {
  return `She just texted that she's feeling down/low/tired/off. Acknowledge it briefly without being preachy or trying to fix it. Tell her Aaron loves her exactly as she is right now, no need to perform.`;
}
