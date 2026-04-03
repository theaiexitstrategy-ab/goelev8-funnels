// app/api/funnel/generate/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Anthropic from '@anthropic-ai/sdk';
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { TIER_LIMITS, type Tier } from '@/lib/tiers';
import { createVapiAssistant } from '@/lib/vapi';
import { provisionTollFreeNumber } from '@/lib/twilio';

const EXTRACTION_PROMPT = (prompt: string) => `You are a business data extractor for GoElev8.ai.
Extract structured data from a business description.
Return ONLY valid JSON. No markdown. No explanation. No code fences.

{
  "business_name": "exact business name or best guess",
  "owner_name": "owner first name or null",
  "industry": "one of: fitness|salon|studio|realty|dental|law|hvac|medspa|other",
  "location": "city, state or empty string",
  "phone": "phone number or null",
  "specialty": "what makes them unique, 1 sentence",
  "offer": "their free offer or lead magnet, 1 sentence",
  "headline": "compelling page headline, under 10 words, benefit-driven",
  "subheadline": "1-2 sentences, includes specialty and offer",
  "cta_text": "action verb + outcome, under 6 words",
  "accent_color": "hex — fitness:#00CFFF salon:#C8A882 studio:#9B59FF realty:#4F8EFF dental:#36D986 law:#FF3B3B hvac:#FFB800 medspa:#FF5F9E other:#00CFFF",
  "template_key": "same value as industry",
  "slug_suggestion": "url-safe: lowercase hyphens only, under 40 chars",
  "trust_bullet_1": "short credibility statement for this industry",
  "trust_bullet_2": "short benefit statement",
  "trust_bullet_3": "short urgency or social proof statement"
}

Business description:
${prompt}`;

const SMS_PROMPT = (data: any) => `SMS copywriter for service businesses. Write 5 messages for a 14-day nudge sequence.

Business: ${data.business_name}
Industry: ${data.industry}
Offer: ${data.offer}
Specialty: ${data.specialty}

Rules: under 160 chars each, conversational not salesy, different angle each message,
clear action ask, never sound automated, use [Name] once per message max.

Return ONLY valid JSON. No markdown. No code fences.
{
  "sms_day0": "immediate — open dialogue, ask their goal",
  "sms_day1": "day 1 — deliver value tip for this industry",
  "sms_day3": "day 3 — soft close, surface the offer again",
  "sms_day7": "day 7 — direct ask, simple yes or no",
  "sms_day14": "day 14 — reactivation, new angle or time hook"
}`;

const AGENT_PROMPT = (data: any, calLink: string) => `Write a Vapi AI phone agent system prompt using SPIN selling.

Business: ${data.business_name}
Industry: ${data.industry}
Offer: ${data.offer}
Specialty: ${data.specialty}
Calendar: ${calLink}

Agent must: confirm who it's talking to, reference their opt-in,
ask a qualifying question about their goal, handle top 3 objections
for this industry, book them via the calendar link, stay under 5 minutes.

Return ONLY valid JSON. No markdown. No code fences.
{
  "agent_script": "full system prompt 400-600 words",
  "agent_opening": "first thing agent says, warm 1-2 sentences",
  "agent_knowledgebase": "3-5 paragraphs of business knowledge"
}`;

export async function POST(req: Request) {
  try {
    // 1. Rate limit
    const limited = await applyRateLimit(publicArcjet, req);
    if (limited) return limited;

    // 2. CSRF
    validateCSRF(req);

    // 3. Auth
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Allow admin seed script to bypass (x-admin-seed header with ADMIN_EMAIL)
    const adminHeader = req.headers.get('x-admin-seed');
    const isAdminSeed = adminHeader === process.env.ADMIN_EMAIL;

    // Parse body once
    const body = await req.json().catch(() => ({}));

    let userId: string;
    if (isAdminSeed) {
      userId = body.user_id;
    } else {
      if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      userId = session.user.id;
    }

    // 4. Load user + tier
    const service = createServiceClient();
    const { data: user } = await service.from('users').select('*').eq('id', userId).single();
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const limits = TIER_LIMITS[user.tier as Tier] || TIER_LIMITS.trial;

    // 5. Funnel limit check (skip for demo accounts)
    if (!user.is_demo) {
      const { count } = await service.from('funnels')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);
      if ((count || 0) >= limits.funnels)
        return Response.json({ error: 'Funnel limit reached', upgrade: true }, { status: 402 });
    }

    // 6. Parse prompt
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 2000) : '';
    if (prompt.length < 10) return Response.json({ error: 'Please describe your business' }, { status: 400 });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 7. Extract business data (Sonnet — quality matters)
    const extractionRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: EXTRACTION_PROMPT(prompt) }],
    });
    const extracted = JSON.parse(
      (extractionRes.content[0] as any).text.replace(/```json|```/g, '').trim()
    );

    // 8. Generate SMS sequence (Haiku — speed matters)
    const smsRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: SMS_PROMPT(extracted) }],
    });
    const smsData = JSON.parse(
      (smsRes.content[0] as any).text.replace(/```json|```/g, '').trim()
    );

    // 9. Generate agent script (Grow+ only)
    let agentData = { agent_script: '', agent_opening: '', agent_knowledgebase: '' };
    if (limits.ai_agent) {
      const calLink = `https://goelev8.ai/f/${extracted.slug_suggestion}/book`;
      const agentRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: AGENT_PROMPT(extracted, calLink) }],
      });
      try {
        agentData = JSON.parse((agentRes.content[0] as any).text.replace(/```json|```/g, '').trim());
      } catch { /* Use empty defaults */ }
    }

    // 10. Ensure unique slug
    const base = (extracted.slug_suggestion || '').replace(/[^a-z0-9-]/g, '').slice(0, 40);
    let slug = base || 'my-business';
    for (let i = 1; i < 100; i++) {
      const { data: ex } = await service.from('funnels').select('id').eq('slug', slug).single();
      if (!ex) break;
      slug = `${base}-${i}`;
    }

    // 11. Provision Twilio number (non-blocking if it fails)
    let twilioNumber = '', twilioSid = '';
    try {
      const t = await provisionTollFreeNumber(userId);
      twilioNumber = t.phoneNumber;
      twilioSid = t.sid;
    } catch (e) { console.error('Twilio provision failed:', e); }

    // 12. Create Vapi assistant (Grow+ only)
    let vapiAssistantId = '';
    if (limits.ai_agent && agentData.agent_script) {
      try {
        const vapi = await createVapiAssistant({
          businessName: extracted.business_name,
          agentScript: agentData.agent_script,
          agentOpening: agentData.agent_opening,
          knowledgebase: agentData.agent_knowledgebase,
        });
        vapiAssistantId = vapi.id;
      } catch (e) { console.error('Vapi creation failed:', e); }
    }

    // 13. Write everything to Supabase
    // The page lives at goelev8.ai/f/[slug] — rendered SSR from this row
    const funnelRow = {
      user_id: userId,
      slug,
      prompt,
      ...extracted,
      ...smsData,
      ...agentData,
      twilio_number: twilioNumber,
      twilio_number_sid: twilioSid,
      vapi_assistant_id: vapiAssistantId,
      page_url: `https://goelev8.ai/f/${slug}`,
      ai_agent_enabled: limits.ai_agent,
      chat_widget_enabled: true,
      sms_enabled: true,
      store_enabled: user.tier === 'scale',
    };

    const { data: funnel } = await service.from('funnels').insert(funnelRow).select().single();

    // 14. Submit A2P in background for paid accounts
    if (!user.is_demo && user.tier !== 'trial' && user.a2p_status === 'pending') {
      service.functions.invoke('submit-a2p', { body: { user_id: userId } }).catch(console.error);
    }

    return Response.json({
      success: true,
      funnel,
      url: `https://goelev8.ai/f/${slug}`,
      preview: { headline: extracted.headline, offer: extracted.offer },
    });

  } catch (err) {
    console.error('[funnel/generate]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
