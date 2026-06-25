// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/onboard/checkout?slug=<onboarding-config-slug>
//   → creates a Stripe Checkout Session with:
//        line item 1: setup fee (one-time)
//        line item 2: $99/mo subscription (or whatever the config sets)
//   → returns { url } pointing at the hosted Stripe Checkout page.
//
// Subscription mode lets us mix the one-time setup line and the recurring
// monthly line in a single Checkout. metadata.onboarding_slug round-trips
// to the webhook so it knows which client/config the payment belongs to.

import Stripe from 'stripe';
import { getConfig } from '@/lib/onboarding-configs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug') || '';
    const cfg = getConfig(slug);
    if (!cfg) {
      return Response.json({ error: 'Unknown onboarding slug' }, { status: 404 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const stripe = new Stripe(stripeKey);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        // One-time setup fee, billed on the first subscription invoice.
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cfg.setupFeeCents,
          product_data: {
            name: 'GoElev8.ai Setup Fee',
            description: `Setup & build for ${cfg.businessName}`,
          },
        },
      },
    ];

    if (cfg.stripeMonthlyPriceId) {
      lineItems.push({ price: cfg.stripeMonthlyPriceId, quantity: 1 });
    } else {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cfg.monthlyPriceCents,
          recurring: { interval: 'month' },
          product_data: {
            name: 'GoElev8.ai Monthly Plan',
            description: 'Hosting, maintenance, portal, automation',
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: lineItems,
      // Note: subscription mode auto-creates a Customer (it's required for
      // subscriptions), so customer_creation here is illegal. Stripe will
      // still surface the buyer's email + shipping/name via the session,
      // which is all we use in the webhook.
      billing_address_collection: 'auto',
      // Stripe replaces {CHECKOUT_SESSION_ID} with the session id on redirect.
      success_url: `${APP_URL}/onboard/start/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/onboard/${cfg.slug}`,
      metadata: {
        onboarding_slug: cfg.slug,
        business_name: cfg.businessName,
        plan: cfg.plan,
      },
      subscription_data: {
        // 30-day trial on the recurring portion so the buyer pays ONLY the
        // setup fee today ($400). The $99/mo charge kicks in 30 days from
        // the checkout date. Matches the "$X today + $Y/mo" framing on the
        // sales page.
        trial_period_days: 30,
        metadata: {
          onboarding_slug: cfg.slug,
          plan: cfg.plan,
        },
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[onboard/checkout]', err?.message ?? err);
    return Response.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
