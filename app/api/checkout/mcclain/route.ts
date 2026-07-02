// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/checkout/mcclain
//
// Creates a single Stripe Checkout Session that charges the tier's one-time
// setup fee AND starts the recurring monthly subscription in the same
// checkout. This works because Stripe accepts a one-time price as a line
// item on a subscription-mode session — the one-time price is added to the
// first invoice, and the recurring price becomes the ongoing subscription.
//
// Uses inline price_data — no pre-created Stripe Products/Prices required.
// Matches how /qsetup, /affsetup, /july4, and /smscalc work: whatever mode
// STRIPE_SECRET_KEY is in, that's the mode the checkout runs in. No new
// env vars.
//
// (Optional: scripts/create-mcclain-stripe-products.ts still exists — run
// it if you'd rather use pre-created Prices for cleaner Stripe dashboard
// reporting. If you do, wire the returned price IDs into env vars and
// swap the price_data blocks below for `price: process.env.…`.)
//
// Body: { tier: 'base' | 'growth' | 'fullscale' }
//
// Success → /mcclain/demo/thank-you?session_id=cs_...
// Cancel  → /mcclain/demo#pricing
//
// The session is stamped with metadata.source='mcclain' so the shared
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

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const productBase = `McClain Law Intake — ${tier.name} Tier`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        // Recurring monthly subscription — ongoing $147/$297/$497 per month.
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tier.monthlyCents,
            recurring: { interval: 'month' },
            product_data: {
              name: `${productBase} — Monthly`,
              description: `${tier.bullets.slice(0, 3).join(' · ')}. Cancel anytime.`,
            },
          },
        },
        // One-time setup fee — lands on the FIRST invoice only, does not recur.
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tier.setupCents,
            product_data: {
              name: `${productBase} — One-Time Setup`,
              description:
                'Configuration, integration, testing, and launch of your intake agent. Charged once on your first invoice.',
            },
          },
        },
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
