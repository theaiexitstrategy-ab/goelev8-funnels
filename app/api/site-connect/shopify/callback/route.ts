// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const shop = url.searchParams.get('shop');
  const funnel_id = url.searchParams.get('state'); // Passed in OAuth initiation

  if (!code || !shop)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/funnels?error=no_code`);

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);

  // Exchange code for Shopify access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();

  // Inject GoElev8 widget script via Shopify Script Tags API
  const service = createServiceClient();
  const { data: funnel } = await service
    .from('funnels').select('slug').eq('id', funnel_id).single();

  if (funnel) {
    await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: `https://goelev8.ai/widget.js?funnel=${funnel.slug}`,
        },
      }),
    });

    await service.from('funnels').update({
      site_connect_url: `https://${shop}`,
      site_connect_platform: 'shopify',
      site_connect_token: access_token,
      site_connected_at: new Date().toISOString(),
    }).eq('id', funnel_id);
  }

  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/portal/funnels/${funnel_id}?connected=shopify`
  );
}
