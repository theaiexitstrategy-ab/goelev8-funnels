// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// GET /api/clients/status/[slug]
//
// Returns current onboarding state for a client. Public — does not return
// any sensitive fields. Used by the portal admin view.

import { createServiceClient } from '@/lib/db/supabase-service';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('clients')
    .select('slug, business_name, onboarding_status, onboarding_step, onboarding_config_slug, paid_at, plan, tier')
    .or(`slug.eq.${params.slug},onboarding_config_slug.eq.${params.slug}`)
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[clients/status]', error.message);
    return Response.json({ error: 'lookup failed' }, { status: 500 });
  }
  if (!data) return Response.json({ error: 'not found' }, { status: 404 });

  return Response.json({
    slug: data.slug,
    business_name: data.business_name,
    onboarding_status: data.onboarding_status,
    onboarding_step: data.onboarding_step,
    onboarding_config_slug: data.onboarding_config_slug,
    paid_at: data.paid_at,
    plan: data.plan,
    tier: data.tier,
  });
}
