// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return Response.json({ error: 'Please describe your business in more detail.' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a business page generator for GoElev8.ai. Given a business description, generate a JSON response with these fields:
- business_name: A clean business name extracted or inferred from the description
- slug: A URL-friendly slug (lowercase, hyphens, no special chars, max 30 chars)
- tagline: A punchy 5-8 word tagline for the business
- sms_preview: The first SMS message that would be sent to a new lead (under 160 chars, friendly, includes business name)
- accent_color: A hex color that fits the business type (e.g. fitness=#FF6B35, beauty=#EC4899, music=#8B5CF6)
- cta_text: The call-to-action button text (e.g. "Book Free Assessment", "Claim Your Spot")

Business description: "${prompt.trim().slice(0, 500)}"

Respond with ONLY valid JSON, no markdown or explanation.`
        }
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    let result;
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      // Fallback if Claude doesn't return valid JSON
      const slugBase = prompt.trim().split(/\s+/).slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
      result = {
        business_name: prompt.trim().split(/[.,!]/).at(0)?.trim().slice(0, 50) || 'Your Business',
        slug: slugBase || 'my-business',
        tagline: 'Your next customer is one prompt away.',
        sms_preview: `Hey! Thanks for your interest. We'd love to help you out. Reply YES to learn more!`,
        accent_color: '#00CFFF',
        cta_text: 'Get Started',
      };
    }

    return Response.json(result);
  } catch (err) {
    console.error('[generate-preview]', err);
    return Response.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
