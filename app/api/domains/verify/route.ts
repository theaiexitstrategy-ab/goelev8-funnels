// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function POST(req: Request) {
  const limited = await applyRateLimit(publicArcjet, req);
  if (limited) return limited;

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { domain, funnel_id } = await req.json();

  const vercelRes = await fetch(
    `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`,
    { headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` } }
  );
  const data = await vercelRes.json();

  if (data.verified) {
    const service = createServiceClient();
    await service.from('funnels').update({ domain_status: 'active' })
      .eq('id', funnel_id).eq('user_id', session.user.id);
  }

  return Response.json({ verified: data.verified, dns_instructions: data.verification || [] });
}
