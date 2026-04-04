// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';

const strip = (v: string) => v.replace(/<[^>]*>/g, '').trim();

const captureSchema = z.object({
  full_name:    z.string().min(1).max(100).transform(strip),
  email:        z.string().email().max(200).optional(),
  phone:        z.string().min(7).max(20),
  source:       z.enum(['homepage','pricing','powered_by','demo','referral'])
                  .default('homepage'),
  page_url:     z.string().url().max(500).optional(),
  utm_source:   z.string().max(100).transform(strip).optional(),
  utm_medium:   z.string().max(100).transform(strip).optional(),
  utm_campaign: z.string().max(100).transform(strip).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limit — always first
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    // 2. CSRF validation
    validateCSRF(req);

    // 3. Parse + validate input
    const body = await req.json();
    const parsed = captureSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { full_name, email, phone, source, page_url,
            utm_source, utm_medium, utm_campaign } = parsed.data;

    const supabase = createServiceClient();

    // 4. Duplicate phone check — silent dedup, return success
    const { data: existing } = await supabase
      .from('platform_leads')
      .select('id, status')
      .eq('phone', phone)
      .single();

    if (existing) {
      // Already captured — do not create duplicate
      return Response.json({ success: true, lead_id: existing.id });
    }

    // 5. Insert platform lead
    const { data: lead, error } = await supabase
      .from('platform_leads')
      .insert({
        full_name,
        email:        email || null,
        phone,
        source,
        page_url:     page_url || null,
        utm_source:   utm_source || null,
        utm_medium:   utm_medium || null,
        utm_campaign: utm_campaign || null,
        status:       'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[leads/capture] insert error:', error.code);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // 6. Supabase webhook fires automatically on INSERT
    //    send-homepage-sms edge function handles the SMS

    return Response.json({ success: true, lead_id: lead.id });

  } catch (err) {
    console.error('[leads/capture]', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
