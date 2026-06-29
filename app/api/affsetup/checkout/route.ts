// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/affsetup/checkout
//   Creates a one-time $400 Stripe Checkout Session for the AFF HVAC
//   Presence Tier setup. Mirrors /api/qsetup/checkout exactly — same
//   structure, same metadata schema. The $99/mo subscription and the
//   $10-per-booked-appointment performance fee are NOT billed here; both
//   kick in only after Aaron flips the agent live (handled in the
//   provisioning pipeline + Stripe dashboard).
//
//   Metadata is the canonical schema consumed by /api/webhooks/stripe:
//     { slug, config_slug, owner_phone, ... }

import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

const CLIENT = {
  slug: 'afff',
  ownerName: 'Kevin',
  businessName: "A Family's Future Heating & Cooling LLC",
  phone: '3145039944',
  tier: 'presence',
  setupFeeCents: 40000,
  productName: 'AFF HVAC Setup — GoElev8.ai Presence Tier',
  productDescription:
    'Custom 24/7 AI voice agent, Jobber booking integration, SMS confirmations + reminders, client dashboard, and ongoing management.',
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
              description: CLIENT.productDescription,
            },
          },
        },
      ],
      billing_address_collection: 'auto',
      success_url: `${APP_URL}/onboarding/afff?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/affsetup`,
      metadata: {
        // Canonical metadata for /api/webhooks/stripe
        slug: CLIENT.slug,
        config_slug: CLIENT.slug,
        owner_phone: CLIENT.phone,
        // Extra context — helpful in the Stripe dashboard and for legacy
        // /api/onboard/webhook compatibility during cutover.
        owner_name: CLIENT.ownerName,
        business_name: CLIENT.businessName,
        phone: CLIENT.phone,
        tier: CLIENT.tier,
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[affsetup/checkout]', err?.message ?? err);
    return Response.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
