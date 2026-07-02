// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/checkout/mcclain
//
// Creates a single Stripe Checkout Session that charges the tier's one-time
// setup fee AND starts the recurring monthly subscription in the same
// checkout. This works because Stripe accepts a one-time Price as a line
// item on a subscription-mode session — the one-time price is added to the
// first invoice, and the recurring price becomes the ongoing subscription.
//
// Body: { tier: 'base' | 'growth' | 'fullscale' }
//
// Success → /mcclain/demo/thank-you?session_id=cs_...
// Cancel  → /mcclain/demo#pricing
//
// This route is standalone — it does not touch any other tenant's Stripe
// Connect setup or the multi-tenant portal subscription logic. The
// checkout is stamped with metadata.source='mcclain' so the shared
// /api/webhooks/stripe handler can route completion events without
// misfiring the onboarding pipeline.

import Stripe from 'stripe';
import { getMcclainTier } from '@/lib/mcclain-tiers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

export async function POST(req: Request) {
  let body: { tier?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tier = getMcclainTier(String(body.tier ?? ''));
  if (!tier) {
    return Response.json({ error: 'Unknown tier' }, { status: 400 });
  }

  const monthlyPriceId = process.env[tier.monthlyPriceEnv];
  const setupPriceId = process.env[tier.setupPriceEnv];
  if (!monthlyPriceId || !setupPriceId) {
    console.error(
      `[checkout/mcclain] Missing Stripe price env vars for tier=${tier.key}. Need ${tier.monthlyPriceEnv} and ${tier.setupPriceEnv}. Run scripts/create-mcclain-stripe-products.ts and paste the IDs into Vercel.`,
    );
    return Response.json({ error: 'Checkout not configured for this tier yet' }, { status: 503 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        // Recurring subscription. Ongoing $147/$297/$497 per month.
        { price: monthlyPriceId, quantity: 1 },
        // One-time setup fee. Added to the FIRST invoice only (does not recur).
        { price: setupPriceId, quantity: 1 },
      ],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      success_url: `${APP_URL}/mcclain/demo/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/mcclain/demo#pricing`,
      metadata: {
        source: 'mcclain',
        tier: tier.key,
        tier_name: tier.name,
        monthly_cents: String(tier.monthlyCents),
        setup_cents: String(tier.setupCents),
      },
      subscription_data: {
        metadata: {
          source: 'mcclain',
          tier: tier.key,
        },
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[checkout/mcclain]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
