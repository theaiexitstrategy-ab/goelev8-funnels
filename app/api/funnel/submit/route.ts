// app/api/funnel/submit/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { funnelSubmitSchema } from '@/lib/security/sanitize';
import { createServiceClient } from '@/lib/db/supabase-service';
import { TIER_LIMITS } from '@/lib/tiers';

export async function POST(req: Request) {
  try {
    // 1. Rate limit (no CSRF — public form, no auth)
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    // 2. Validate input
    const body = await req.json();
    const parsed = funnelSubmitSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: 'Invalid submission' }, { status: 400 });

    const { funnel_slug, full_name, phone, email, goal, source } = parsed.data;
    const supabase = createServiceClient();

    // 3. Load funnel + owner
    const { data: funnel } = await supabase
      .from('funnels')
      .select('*, users(*)')
      .eq('slug', funnel_slug)
      .eq('is_active', true)
      .single();

    if (!funnel) return Response.json({ error: 'Not found' }, { status: 404 });

    const user = funnel.users as any;
    const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];

    // 4. Monthly lead limit check
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    if ((count || 0) >= limits.leads_per_month)
      return Response.json({ success: true }); // Silent — don't expose limit to spammers

    // 5. Check for duplicate phone on this funnel
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('funnel_id', funnel.id)
      .eq('phone', phone)
      .single();

    if (existing) return Response.json({ success: true }); // Dedup silently

    // 6. Insert lead
    const { data: lead } = await supabase.from('leads').insert({
      funnel_id: funnel.id,
      user_id: user.id,
      full_name, phone, email, goal,
      source: user.is_demo ? 'demo' : source,
      status: funnel.sms_enabled ? 'sms_sequence' : 'new',
      sms_step: 0,
      next_sms_at: funnel.sms_enabled
        ? new Date(Date.now() + 60 * 1000).toISOString() // Day 0 in 60 seconds
        : null,
    }).select().single();

    // 7. Track analytics
    await supabase.from('funnel_analytics').insert({
      funnel_id: funnel.id,
      user_id: user.id,
      event_type: 'lead_captured',
      metadata: { source, has_email: !!email },
    });

    // 8. Trigger AI call (Grow+ only, non-blocking)
    if (funnel.ai_agent_enabled && funnel.vapi_assistant_id && lead) {
      supabase.functions
        .invoke('trigger-vapi-call', { body: { lead_id: lead.id, funnel_id: funnel.id } })
        .catch(console.error);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error('[funnel/submit]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
