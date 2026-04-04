// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const funnel_id = url.searchParams.get('state');

  if (!code)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/funnels?error=no_code`);

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);

  // Exchange code for Squarespace access token
  const tokenRes = await fetch('https://login.squarespace.com/api/1/login/oauth/provider/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/site-connect/squarespace/callback`,
      client_id: process.env.SQUARESPACE_CLIENT_ID,
      client_secret: process.env.SQUARESPACE_CLIENT_SECRET,
    }),
  });
  const { access_token } = await tokenRes.json();

  const service = createServiceClient();
  const { data: funnel } = await service
    .from('funnels').select('slug').eq('id', funnel_id).single();

  if (funnel) {
    // Inject GoElev8 widget via Squarespace code injection API
    const widgetScript = `<script src="https://goelev8.ai/widget.js" data-funnel="${funnel.slug}" defer></script>`;

    // Get current site ID
    const siteRes = await fetch('https://api.squarespace.com/1.0/authorization/website', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const siteData = await siteRes.json();

    if (siteData.website?.id) {
      await fetch(`https://api.squarespace.com/1.0/commerce/website/${siteData.website.id}/code-injection`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ footerCode: widgetScript }),
      });
    }

    await service.from('funnels').update({
      site_connect_url: siteData.website?.url || '',
      site_connect_platform: 'squarespace',
      site_connect_token: access_token,
      site_connected_at: new Date().toISOString(),
    }).eq('id', funnel_id);
  }

  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/portal/funnels/${funnel_id}?connected=squarespace`
  );
}
