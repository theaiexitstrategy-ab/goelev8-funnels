// app/api/stripe/connect/callback/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';
import Stripe from 'stripe';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Used as CSRF for OAuth
    if (!code) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/products?error=no_code`);

    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);

    // Exchange code for Stripe Connect account ID
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });
    const stripeAccountId = response.stripe_user_id;

    // Store on user record
    const service = createServiceClient();
    await service.from('users')
      .update({ stripe_connect_account_id: stripeAccountId })
      .eq('id', session.user.id);

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/products?connected=true`);

  } catch (err) {
    console.error('[stripe/connect/callback]', err);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/products?error=connect_failed`);
  }
}
