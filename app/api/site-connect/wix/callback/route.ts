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

  // Exchange code for Wix access token
  const tokenRes = await fetch('https://www.wixapis.com/oauth/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.WIX_CLIENT_ID,
      client_secret: process.env.WIX_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();

  const service = createServiceClient();
  const { data: funnel } = await service
    .from('funnels').select('slug').eq('id', funnel_id).single();

  if (funnel) {
    // Inject GoElev8 widget via Wix site properties embed
    const widgetScript = `<script src="https://goelev8.ai/widget.js" data-funnel="${funnel.slug}" defer></script>`;

    await fetch('https://www.wixapis.com/site-properties/v4/properties', {
      method: 'PATCH',
      headers: {
        Authorization: access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          trackingCodes: [{
            type: 'CUSTOM',
            code: widgetScript,
            placement: 'BODY_END',
          }],
        },
      }),
    });

    // Get site URL
    const siteRes = await fetch('https://www.wixapis.com/site-properties/v4/properties', {
      headers: { Authorization: access_token },
    });
    const siteData = await siteRes.json();

    await service.from('funnels').update({
      site_connect_url: siteData.properties?.siteUrl || '',
      site_connect_platform: 'wix',
      site_connect_token: access_token,
      site_connected_at: new Date().toISOString(),
    }).eq('id', funnel_id);
  }

  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/portal/funnels/${funnel_id}?connected=wix`
  );
}
