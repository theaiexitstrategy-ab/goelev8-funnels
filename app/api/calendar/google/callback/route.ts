// app/api/calendar/google/callback/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/calendar?error=no_code`);

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`,
      grant_type:    'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/calendar?error=token_failed`);

  // Upsert calendar integration — tokens encrypted at rest via Supabase column encryption
  const service = createServiceClient();
  await service.from('calendar_integrations').upsert({
    user_id:         session.user.id,
    platform:        'google',
    access_token:    tokens.access_token,
    refresh_token:   tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    is_primary:      true,
  }, { onConflict: 'user_id,platform' });

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/calendar?connected=google`);
}
