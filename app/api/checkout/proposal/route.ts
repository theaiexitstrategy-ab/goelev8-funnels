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
};

const PLANS: Record<ProposalPlan, PlanDef> = {
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
    const session = await stripe.checkout.sessions.create({
      mode: plan.recurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
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
      ],
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
      ...(plan.recurring
        ? {
            subscription_data: {
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
