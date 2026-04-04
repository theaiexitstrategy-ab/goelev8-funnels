// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Anthropic from '@anthropic-ai/sdk';
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

const anthropic = new Anthropic();

const previewSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

const FALLBACK = {
  headline: 'Grow Your Business Today',
  offer: 'Free consultation',
  sms_day0: 'Hey! Thanks for reaching out. What goal are you working toward right now?',
  agent_opening: 'Hi there! Welcome — I\'d love to learn more about your business and how we can help you grow.',
};

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    const body = await req.json();
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: 'Invalid input' }, { status: 400 });

    const { prompt } = parsed.data;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `You are a business data extractor for GoElev8.ai. Extract from this business description and generate marketing copy.

Business description: "${prompt.slice(0, 1000)}"

Return ONLY valid JSON, no markdown:
{
  "business_name": "business name",
  "headline": "compelling page headline under 10 words",
  "offer": "their free offer or lead magnet",
  "sms_day0": "Day 0 SMS under 160 chars, conversational, asks their goal",
  "agent_opening": "AI agent opening line, warm 1-2 sentences"
}`,
      }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    let result: Record<string, string>;

    try {
      result = JSON.parse(text);
    } catch {
      console.error('[funnel/preview] Failed to parse Claude response:', text);
      return Response.json(FALLBACK);
    }

    return Response.json({
      headline: result.headline || FALLBACK.headline,
      offer: result.offer || FALLBACK.offer,
      sms_day0: result.sms_day0 || FALLBACK.sms_day0,
      agent_opening: result.agent_opening || FALLBACK.agent_opening,
    });

  } catch (err) {
    console.error('[funnel/preview]', err);
    return Response.json(FALLBACK);
  }
}
