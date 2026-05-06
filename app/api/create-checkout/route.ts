// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Founding Client Checkout — uses the products and coupon created by
// scripts/setup-stripe-onboarding.ts so the line items, prices, and
// FOUNDING discount match the Payment Link and stay consistent in
// Stripe analytics.
//
// Required Stripe state (run the setup script if any of these are missing):
//   - Price with lookup_key 'goelev8_onboarding_setup_400'    ($400 one-time)
//   - Price with lookup_key 'goelev8_growth_plan_99_monthly'  ($99 monthly)
//   - Coupon id 'FOUNDING'                                    (50% off setup)
//
// Returns { url } pointing at the hosted Stripe Checkout session.

import Stripe from 'stripe';

const SETUP_PRICE_LOOKUP_KEY = 'goelev8_onboarding_setup_400';
const GROWTH_PRICE_LOOKUP_KEY = 'goelev8_growth_plan_99_monthly';
const FOUNDING_COUPON_ID = 'FOUNDING';

async function findPriceByLookupKey(stripe: Stripe, key: string): Promise<Stripe.Price> {
  const list = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (!list.data.length) {
    throw new Error(
      `Stripe price with lookup_key '${key}' not found. Run scripts/setup-stripe-onboarding.ts first.`,
    );
  }
  return list.data[0];
}

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.goelev8.ai';

    const [setupPrice, growthPrice] = await Promise.all([
      findPriceByLookupKey(stripe, SETUP_PRICE_LOOKUP_KEY),
      findPriceByLookupKey(stripe, GROWTH_PRICE_LOOKUP_KEY),
    ]);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [
        { price: setupPrice.id, quantity: 1 },
        { price: growthPrice.id, quantity: 1 },
      ],
      // FOUNDING is scoped to the setup product (50% off), so the subscription
      // line stays at $99/mo while the setup shows $400 → $200.
      discounts: [{ coupon: FOUNDING_COUPON_ID }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      billing_address_collection: 'auto',
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error('[create-checkout] error:', err?.message || err);
    return Response.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
