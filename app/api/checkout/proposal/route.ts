// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/checkout/proposal
//
// Handles all 4 Stripe checkouts on /anuday-proposal — A Nu Day setup +
// monthly, Free Flow setup + monthly — with a single endpoint that
// branches on `plan`.
//
// Uses inline price_data (same pattern as /qsetup, /affsetup, /july4,
// /mcclain checkouts) so no pre-created Stripe Prices are needed and no
// new env vars beyond the shared STRIPE_SECRET_KEY.
//
// Success → /anuday-proposal/thank-you?session_id=cs_...
// Cancel  → /anuday-proposal
//
// The session is stamped with metadata.source='proposal' + metadata.plan
// so the shared /api/webhooks/stripe handler can route completion events
// without misfiring the onboarding pipeline. The webhook does not currently
// have a specific 'proposal' branch — completions fall through and get
// ignored. Add a handler there later if we want signup notifications.

import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

type ProposalPlan =
  | 'bundle'
  | 'anuday-setup'
  | 'anuday-monthly'
  | 'freeflow-setup'
  | 'freeflow-monthly';

type PlanDef = {
  business: string;
  productName: string;
  productDescription: string;
  amountCents: number;
  recurring: boolean;
  // Bundle-only: additional recurring line item alongside the setup.
  // When present, the checkout is created in subscription mode with
  // BOTH the one-time setup (amountCents) and the recurring price
  // (bundleRecurring) as line items. The subscription gets a 30-day
  // trial so only the setup fee lands today.
  bundleRecurring?: {
    productName: string;
    productDescription: string;
    amountCents: number;
  };
};

const PLANS: Record<ProposalPlan, PlanDef> = {
  // CANONICAL PLAN — one payment covering both businesses.
  // Setup fee ($400 = 2 × $200 founding-partner rate) today; $99/mo
  // subscription (2 × $49.50 founding-partner rate) starts after a
  // 30-day trial so monthly billing doesn't kick in during the build.
  bundle: {
    business: 'A Nu Day Therapy · Free Flow Fitness',
    productName: 'GoElev8.ai — Website Setup (Both Businesses)',
    productDescription:
      'One-time setup for both A Nu Day Therapy and Free Flow Fitness: two Next.js sites, two dedicated AI phone lines, auto-SMS follow-up on all forms, one dashboard. Founding-partner combined rate.',
    amountCents: 40000, // $400 today
    recurring: false,
    bundleRecurring: {
      productName: 'GoElev8.ai — Monthly Platform (Both Businesses)',
      productDescription:
        'Ongoing platform covering both A Nu Day Therapy and Free Flow Fitness: AI phone lines, SMS automation, hosting, dashboard, edits. Founding-partner combined rate. First billing period starts 30 days after signup so monthly does not begin during the build.',
      amountCents: 9900, // $99/mo
    },
  },
  // Kept for backwards compatibility / direct-link flexibility.
  // Not linked from the proposal page anymore, but the endpoint still
  // accepts them if you ever want to sell a single business à la carte.
  'anuday-setup': {
    business: 'A Nu Day Therapy',
    productName: 'A Nu Day Therapy — Website Setup',
    productDescription:
      'One-time setup: rebuild anudaytherapy.com in Next.js around the $100/30-min consultation, dedicated AI phone line, auto-SMS on form submission. Founding-partner pricing.',
    amountCents: 20000, // $200 (was $400)
    recurring: false,
  },
  'anuday-monthly': {
    business: 'A Nu Day Therapy',
    productName: 'A Nu Day Therapy — Monthly Platform',
    productDescription:
      'Ongoing GoElev8.ai platform: AI phone line, SMS automation, hosting, dashboard, edits. Founding-partner pricing. Starts once your new site is live.',
    amountCents: 4950, // $49.50/mo (was $99/mo)
    recurring: true,
  },
  'freeflow-setup': {
    business: 'Free Flow Fitness',
    productName: 'Free Flow Fitness — Website Setup',
    productDescription:
      'One-time setup: new Next.js site with dual booking paths (parties + 1-on-1 training), dedicated AI phone line, auto-SMS on form submission. Founding-partner pricing.',
    amountCents: 20000, // $200 (was $400)
    recurring: false,
  },
  'freeflow-monthly': {
    business: 'Free Flow Fitness',
    productName: 'Free Flow Fitness — Monthly Platform',
    productDescription:
      'Ongoing GoElev8.ai platform: AI phone line, SMS automation, hosting, dashboard, edits. Founding-partner pricing. Starts once your new site is live.',
    amountCents: 4950, // $49.50/mo (was $99/mo)
    recurring: true,
  },
};

function isPlan(x: string): x is ProposalPlan {
  return x in PLANS;
}

export async function POST(req: Request) {
  let body: { plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const planKey = String(body.plan ?? '');
  if (!isPlan(planKey)) {
    return Response.json({ error: 'Unknown plan' }, { status: 400 });
  }
  const plan = PLANS[planKey];

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    // Bundle plan is unique: subscription-mode checkout with BOTH the
    // one-time setup fee AND the recurring monthly as line items. A
    // 30-day trial on the subscription means only the setup fee lands
    // today; monthly billing starts after the build is expected to be
    // complete.
    const isBundle = planKey === 'bundle' && plan.bundleRecurring;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isBundle
      ? [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: plan.bundleRecurring!.amountCents,
              recurring: { interval: 'month' },
              product_data: {
                name: plan.bundleRecurring!.productName,
                description: plan.bundleRecurring!.productDescription,
              },
            },
          },
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: plan.amountCents,
              product_data: {
                name: plan.productName,
                description: plan.productDescription,
              },
            },
          },
        ]
      : [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: plan.amountCents,
              ...(plan.recurring ? { recurring: { interval: 'month' } } : {}),
              product_data: {
                name: plan.productName,
                description: plan.productDescription,
              },
            },
          },
        ];

    const useSubMode = plan.recurring || isBundle;

    const session = await stripe.checkout.sessions.create({
      mode: useSubMode ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      success_url: `${APP_URL}/anuday-proposal/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/anuday-proposal`,
      metadata: {
        source: 'proposal',
        plan: planKey,
        business: plan.business,
        prepared_for: 'Adrianne Martin',
      },
      ...(useSubMode
        ? {
            subscription_data: {
              // 30-day trial only for the bundle — the standalone
              // monthly plans (anuday-monthly / freeflow-monthly)
              // begin billing immediately since they're purchased
              // after go-live, per the timeline copy on the page.
              ...(isBundle ? { trial_period_days: 30 } : {}),
              metadata: {
                source: 'proposal',
                plan: planKey,
                business: plan.business,
              },
            },
          }
        : {}),
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[checkout/proposal]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
