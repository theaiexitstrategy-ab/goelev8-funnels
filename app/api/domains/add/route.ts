// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(publicArcjet, req);
    if (limited) return limited;
    validateCSRF(req);

    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { domain, funnel_id } = await req.json();
    if (!domain || !funnel_id) return Response.json({ error: 'Missing params' }, { status: 400 });

    const service = createServiceClient();
    const { data: user } = await service.from('users').select('tier').eq('id', session.user.id).single();

    // Tier check — custom domains are paid plans only
    if (!user || !['launch', 'grow', 'scale'].includes(user.tier))
      return Response.json({ error: 'Upgrade required' }, { status: 402 });

    // Add domain to Vercel project
    const vercelRes = await fetch(
      `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    );
    const vercelData = await vercelRes.json();

    // Update funnel
    await service.from('funnels').update({
      custom_domain: domain,
      domain_status: 'pending',
    }).eq('id', funnel_id).eq('user_id', session.user.id);

    return Response.json({
      success: true,
      dns_instructions: vercelData.verification || [],
      domain,
    });

  } catch (err) {
    console.error('[domains/add]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
