// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/qsetup/checkout
//   Creates a one-time $400 Stripe Checkout Session for the ROQ Body
//   Presence Tier setup. The $99/mo subscription is NOT charged here —
//   it kicks in only after Aaron flips ROQ Body's agent live (handled
//   manually in Stripe, since billing starts after onboarding).

import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

const CLIENT = {
  slug: 'roqbody',
  owner: 'Quantarrius Wilson',
  tier: 'presence',
  setupFeeCents: 40000,
  productName: 'ROQ Body Setup — GoElev8.ai Presence Tier',
};

export async function POST() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: CLIENT.setupFeeCents,
            product_data: {
              name: CLIENT.productName,
              description: 'Custom AI lead agent, branded SMS, dashboard, audit + site brief, and ongoing management.',
            },
          },
        },
      ],
      billing_address_collection: 'auto',
      success_url: `${APP_URL}/onboarding/roqbody?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/qsetup`,
      metadata: {
        client: CLIENT.slug,
        owner: CLIENT.owner,
        tier: CLIENT.tier,
        email: '',
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[qsetup/checkout]', err?.message ?? err);
    return Response.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
