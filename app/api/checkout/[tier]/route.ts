// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Per-tier Stripe Checkout endpoint. Builds a fresh Checkout Session for
// Starter / Growth / Pro using inline price_data — no Stripe products,
// prices, or Payment Links need to exist beforehand.
//
// Returns { url } pointing at the hosted Stripe Checkout session.

import Stripe from 'stripe';

type TierConfig = {
  display: string;
  setupCents: number;
  monthlyCents: number;
  features: string;
};

const TIERS: Record<string, TierConfig> = {
  starter: {
    display: 'Starter',
    setupCents: 30000,
    monthlyCents: 12700,
    features: 'Missed call text-back · Booking calendar · Dedicated number · 300 SMS/mo',
  },
  growth: {
    display: 'Growth',
    setupCents: 40000,
    monthlyCents: 19700,
    features: 'Everything in Starter · AI voice assistant · SMS campaigns · Portal analytics · 600 SMS/mo + 60 min',
  },
  pro: {
    display: 'Pro',
    setupCents: 60000,
    monthlyCents: 29700,
    features: 'Everything in Growth · Multi-agent dashboard · Routing logic · Dedicated account manager · 1,200 SMS/mo + 120 min',
  },
};

export async function POST(req: Request, { params }: { params: { tier: string } }) {
  try {
    const cfg = TIERS[params.tier];
    if (!cfg) {
      return Response.json({ error: `Unknown tier: ${params.tier}` }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.goelev8.ai';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [
        {
          // One-time setup, billed on the first subscription invoice.
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cfg.setupCents,
            product_data: {
              name: `GoElev8.ai ${cfg.display} — Setup`,
              description: 'One-time onboarding & configuration. Live in 48 hours.',
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cfg.monthlyCents,
            product_data: {
              name: `GoElev8.ai ${cfg.display} Plan`,
              description: cfg.features,
            },
            recurring: { interval: 'month' },
          },
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      billing_address_collection: 'auto',
      metadata: { goelev8_tier: params.tier },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error(`[checkout/${params.tier}] error:`, err?.message || err);
    return Response.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
