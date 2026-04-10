// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';
import { createHash } from 'crypto';

const anthropic = new Anthropic();

const buildSchema = z.object({
  prompt: z.string().min(10, 'Describe your business in at least 10 characters').max(500),
});

// ── Rate limiting (3 builds per IP per hour) ──
async function checkRateLimit(req: Request, supabase: ReturnType<typeof createServiceClient>) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  // Clean old entries
  await supabase
    .from('build_rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());

  // Check current count
  const { data: existing } = await supabase
    .from('build_rate_limits')
    .select('id, count')
    .eq('ip_hash', ipHash)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (existing) {
    if (existing.count >= 3) {
      return { limited: true, response: Response.json(
        { error: "You've built 3 pages this hour. Sign up to build unlimited pages." },
        { status: 429 }
      )};
    }
    await supabase
      .from('build_rate_limits')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('build_rate_limits')
      .insert({ ip_hash: ipHash, count: 1, window_start: new Date().toISOString() });
  }

  return { limited: false, response: null };
}

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient();

    // 1. Rate limit
    const rateCheck = await checkRateLimit(req, supabase);
    if (rateCheck.limited) return rateCheck.response;

    // 2. Parse and validate prompt
    const body = await req.json();
    const parsed = buildSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { prompt } = parsed.data;

    // 3. Generate slug via Claude Haiku
    const slugMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Extract a short URL-friendly slug from this business description.
Return ONLY the slug. Max 4 words. Lowercase. Hyphens only. No special chars.
Examples: "flex-facility", "dallas-medspa", "chicago-injury-law"

Business: ${prompt.slice(0, 500)}`,
      }],
    });

    let slug = (slugMessage.content[0]?.type === 'text' ? slugMessage.content[0].text : '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);

    if (!slug) slug = 'my-business';

    // Check slug collision
    const { data: existing } = await supabase
      .from('funnels')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    // 4. Generate funnel content via Claude Haiku
    const buildMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are building a high-converting lead capture page for a local service business.
Respond ONLY with valid JSON. No markdown. No explanation. No backticks.

Business description: ${prompt.slice(0, 500)}

Return exactly this JSON structure:
{
  "industry": "single word category: fitness|medspa|dental|roofing|hvac|legal|salon|studio|realty|other",
  "city": "city name extracted from description or empty string",
  "hero_headline": "3-5 word punchy headline in ALL CAPS — make it specific to their business",
  "hero_subheadline": "One sentence value prop, max 18 words, conversational tone",
  "offer_text": "What they get by submitting the form, max 10 words, start with action verb",
  "cta_text": "Button text, ALL CAPS, max 5 words, include arrow →",
  "feature_1_title": "ALL CAPS, 2-3 words",
  "feature_1_body": "One sentence benefit, max 14 words",
  "feature_2_title": "ALL CAPS, 2-3 words",
  "feature_2_body": "One sentence benefit, max 14 words",
  "feature_3_title": "ALL CAPS, 2-3 words",
  "feature_3_body": "One sentence benefit, max 14 words",
  "feature_4_title": "ALL CAPS, 2-3 words",
  "feature_4_body": "One sentence benefit, max 14 words",
  "sms_1": "Immediate welcome SMS. Personalized. Max 155 chars. Include {{first_name}} and business name.",
  "sms_2": "1 hour follow-up. Value-add tip specific to their industry. Max 155 chars.",
  "sms_3": "24 hour follow-up. Soft urgency. Max 155 chars.",
  "sms_4": "48 hour follow-up. Social proof angle. Max 155 chars.",
  "sms_5": "72 hour final. Last chance. Max 155 chars."
}`,
      }],
    });

    const rawText = buildMessage.content[0]?.type === 'text' ? buildMessage.content[0].text : '';

    // 5. Parse JSON safely — strip backticks if present
    let content: Record<string, string>;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      content = JSON.parse(cleaned);
    } catch {
      console.error('[api/build] Failed to parse Claude response:', rawText);
      return Response.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
    }

    // 6. Insert funnel into Supabase
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: funnel, error: insertError } = await supabase
      .from('funnels')
      .insert({
        slug,
        name: content.hero_headline || slug,
        prompt_input: prompt,
        hero_headline: content.hero_headline || '',
        hero_subheadline: content.hero_subheadline || '',
        offer_text: content.offer_text || '',
        cta_text: content.cta_text || '',
        feature_1_title: content.feature_1_title || '',
        feature_1_body: content.feature_1_body || '',
        feature_2_title: content.feature_2_title || '',
        feature_2_body: content.feature_2_body || '',
        feature_3_title: content.feature_3_title || '',
        feature_3_body: content.feature_3_body || '',
        feature_4_title: content.feature_4_title || '',
        feature_4_body: content.feature_4_body || '',
        industry: content.industry || 'other',
        city: content.city || '',
        is_claimed: false,
        is_prospect: false,
        is_active: true,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[api/build] Supabase insert error:', insertError);
      return Response.json({ error: 'Failed to create funnel page.' }, { status: 500 });
    }

    // 7. Insert SMS nudge sequence
    const smsSteps = [
      { step: 1, body: content.sms_1 || '', delay_label: 'immediate' },
      { step: 2, body: content.sms_2 || '', delay_label: '1_hour' },
      { step: 3, body: content.sms_3 || '', delay_label: '24_hour' },
      { step: 4, body: content.sms_4 || '', delay_label: '48_hour' },
      { step: 5, body: content.sms_5 || '', delay_label: '72_hour' },
    ].filter(s => s.body); // only insert non-empty

    if (smsSteps.length > 0) {
      const { error: smsError } = await supabase
        .from('nudge_messages')
        .insert(smsSteps.map(s => ({
          funnel_id: funnel.id,
          step: s.step,
          body: s.body,
          delay_label: s.delay_label,
          is_active: true,
        })));

      if (smsError) {
        console.error('[api/build] SMS insert error:', smsError);
        // Non-fatal — funnel still created
      }
    }

    // 8. Return response
    return Response.json({
      url: `goelev8.ai/f/${slug}`,
      full_url: `https://goelev8.ai/f/${slug}`,
      slug,
      funnel_id: funnel.id,
      expires_at: expiresAt,
      preview: {
        hero_headline: content.hero_headline || '',
        hero_subheadline: content.hero_subheadline || '',
        offer_text: content.offer_text || '',
        cta_text: content.cta_text || '',
        industry: content.industry || 'other',
        city: content.city || '',
      },
    });

  } catch (err) {
    console.error('[api/build]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
