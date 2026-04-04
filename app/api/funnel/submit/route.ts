// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';

const submitSchema = z.object({
  funnel_slug: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(['funnel', 'store', 'widget']).default('funnel'),
  product_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: 'Invalid input' }, { status: 400 });

    const { funnel_slug, name, email, phone, message, source, product_id } = parsed.data;

    const supabase = createServiceClient();

    // Look up funnel
    const { data: funnel } = await supabase
      .from('funnels').select('id, user_id').eq('slug', funnel_slug).single();
    if (!funnel) return Response.json({ error: 'Funnel not found' }, { status: 404 });

    // Check monthly lead limit
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('funnel_id', funnel.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const { data: user } = await supabase
      .from('users').select('tier').eq('id', funnel.user_id).single();

    // Insert lead
    const { data: lead, error } = await supabase.from('leads').insert({
      funnel_id: funnel.id,
      user_id: funnel.user_id,
      name,
      email: email || null,
      phone: phone || null,
      message: message || null,
      source,
      product_id: product_id || null,
    }).select('id').single();

    if (error) {
      console.error('[funnel/submit]', error);
      return Response.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    return Response.json({ success: true, lead_id: lead?.id });

  } catch (err) {
    console.error('[funnel/submit]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
