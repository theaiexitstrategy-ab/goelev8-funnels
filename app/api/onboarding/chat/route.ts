// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/onboarding/chat
//
// Claude-powered onboarding agent. Stateless on the server side — the client
// (the chat page) keeps the conversation transcript and passes it in on every
// turn. The server builds a fresh system prompt from the live client row +
// config, so anything Aaron updates in the database is reflected immediately.
//
// Request body:
//   {
//     slug:        string,                    // client onboarding slug
//     step:        number,                    // 1-9, which step we're on
//     messages:    [{role, content}, ...],    // anthropic-shaped transcript
//   }
// Auth: x-resume-token header must match clients.resume_token for this slug.

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/db/supabase-service';
import { authenticateResumeToken } from '@/lib/onboarding-runtime';
import { getConfig, getFlags } from '@/lib/onboarding-configs';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

type ChatMsg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { slug?: string; step?: number; messages?: ChatMsg[] }
    | null;
  if (!body?.slug || !Array.isArray(body.messages)) {
    return Response.json({ error: 'slug + messages required' }, { status: 400 });
  }
  const token = req.headers.get('x-resume-token');
  const supabase = createServiceClient();
  const auth = await authenticateResumeToken(supabase, body.slug, token);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const cfg = getConfig(auth.client.onboarding_config_slug ?? body.slug);
  if (!cfg) return Response.json({ error: 'Unknown config' }, { status: 500 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[onboarding/chat] ANTHROPIC_API_KEY not configured');
    return Response.json({ error: 'AI not configured' }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey });

  const flags = getFlags(cfg);
  const stepNum = clampStep(body.step ?? auth.client.onboarding_step ?? 1, flags);
  const stepBrief = STEP_BRIEFS[stepNum] ?? '';
  const firstName = deriveFirstName(auth.client.name) || cfg.clientName || '';

  const system = `You are the GoElev8.ai onboarding agent.

Your job is to walk ${firstName || cfg.businessName} through a brief setup conversation, one step at a time, and collect the info we need to launch their AI agents and portal. Be warm, direct, and brand-aware. Do NOT dump all questions at once — ask ONE thing at a time. Keep responses tight (2-4 short sentences) so the buyer doesn't feel like they're filling out a form.

CLIENT CONTEXT
- Business: ${cfg.businessName}
- Owner: ${cfg.ownerName ?? firstName}
- Tier: ${cfg.tier ?? cfg.plan}
- Industry: ${cfg.knownInfo?.industry ?? 'unknown'}
- Location: ${cfg.knownInfo?.location ?? 'unknown'}
- Website: ${cfg.knownInfo?.website ?? 'unknown'}
- Known services: ${cfg.knownInfo?.services?.join(', ') ?? '(none yet)'}
- Features active: ${activeFlagList(flags)}

CURRENT STEP: ${stepNum}/9
Step brief: ${stepBrief}

RULES
- Greet by first name on your first message. Don't re-greet on later turns.
- After the buyer answers, briefly acknowledge ("Got it." / "Perfect.") and either advance to the next sub-question or, if the step is done, signal completion by ending your reply with a marker on its own line: <<STEP_DONE:${stepNum}>>
- If the buyer asks an off-topic question, answer briefly then return to the current step.
- Never invent details about ${cfg.businessName} — if you don't know something, ask.
- Skip steps that aren't enabled for this client (lead/voice agent / booking).
- On the final step (9), summarize everything from the conversation in a clean readable format, then ask for confirmation. When confirmed, end your reply with <<ONBOARDING_COMPLETE>>

Today is ${new Date().toISOString().slice(0, 10)}.`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('\n');
    return Response.json({ text, step: stepNum });
  } catch (err: any) {
    console.error('[onboarding/chat] Anthropic call failed:', err?.message ?? err);
    return Response.json({ error: 'AI call failed' }, { status: 500 });
  }
}

function clampStep(requested: number, flags: ReturnType<typeof getFlags>): number {
  const s = Number.isFinite(requested) ? requested : 1;
  // If a step is gated by a flag and the flag is off, skip past it. The
  // chat agent's <<STEP_DONE:N>> marker is what advances us — this just
  // protects against bad inputs.
  if (s === 6 && !flags.has_lead_agent) return 8;
  if (s === 7 && !flags.has_voice_agent) return 8;
  if (s === 8 && !flags.has_lead_agent && !flags.has_voice_agent) return 9;
  return Math.min(Math.max(s, 1), 9);
}

function activeFlagList(f: ReturnType<typeof getFlags>): string {
  const on: string[] = [];
  if (f.has_lead_agent) on.push('lead agent');
  if (f.has_voice_agent) on.push('voice agent');
  if (f.has_site_build) on.push('site build');
  if (f.jobber_integration) on.push('Jobber integration');
  return on.length ? on.join(', ') : 'core dashboard only';
}

function deriveFirstName(name: string | null): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}

const STEP_BRIEFS: Record<number, string> = {
  1: 'Contact confirmation. Confirm the buyer is the right person and capture the best phone number to reach them.',
  2: 'Business basics: address or service area, years in business, normal business hours.',
  3: 'Brand assets: logo URL or upload, brand colors, current website URL.',
  4: "Services: have them list everything they offer — services, products, programs. Don't worry about formatting, just capture it all.",
  5: 'Social proof: Google reviews, testimonials, before/after results, press, certifications.',
  6: 'Lead agent config: primary CTA (book a call, fill form, shop, etc.), questions leads always ask, things the agent should never say.',
  7: 'Voice agent config: greeting line, intake info required before booking, calls to transfer instead of book, direct transfer number.',
  8: 'Booking preferences: available days/hours, typical appointment length, buffer time, blocked-out dates.',
  9: 'Final review. Summarize everything captured so far in a clean readable format and ask for confirmation. On confirm, end with <<ONBOARDING_COMPLETE>>.',
};
