// app/api/stripe/checkout/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { SMS_CREDIT_TIERS } from '@/lib/tiers';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(publicArcjet, req);
    if (limited) return limited;
    validateCSRF(req);

    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, plan, sms_package } = await req.json();
    const service = createServiceClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const { data: user } = await service.from('users').select('*').eq('id', session.user.id).single();
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Ensure Stripe customer exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.full_name });
      customerId = customer.id;
      await service.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    if (type === 'subscription') {
      // Subscription with 7-day trial. Card authorized now, charged Day 8.
      const priceMap: Record<string, string> = {
        launch: process.env.STRIPE_PRICE_LAUNCH_MONTHLY!,
        grow:   process.env.STRIPE_PRICE_GROW_MONTHLY!,
        scale:  process.env.STRIPE_PRICE_SCALE_MONTHLY!,
      };
      const priceId = priceMap[plan];
      if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 7,
          trial_settings: { end_behavior: { missing_payment_method: 'pause' } },
          metadata: { user_id: user.id, plan },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        metadata: { user_id: user.id, plan },
      });
      return Response.json({ checkoutUrl: checkoutSession.url });

    } else if (type === 'sms_credits') {
      // One-time SMS credit purchase
      const tier = SMS_CREDIT_TIERS.find(t => t.amount_usd === sms_package);
      if (!tier) return Response.json({ error: 'Invalid package' }, { status: 400 });

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: tier.amount_usd * 100,
            product_data: { name: `${tier.credits} SMS Credits — GoElev8.ai` },
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/billing?credits=added`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/billing`,
        metadata: { user_id: user.id, sms_credits: tier.credits.toString(), amount_usd: tier.amount_usd.toString() },
      });
      return Response.json({ checkoutUrl: checkoutSession.url });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });

  } catch (err) {
    console.error('[stripe/checkout]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
