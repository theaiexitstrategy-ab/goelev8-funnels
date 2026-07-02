// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/july4/checkout
//   Creates a Stripe Checkout Session for the July 4th 2026 50%-off
//   setup fee promo. Auto-applies the JULY4TH50 promotion code so the
//   buyer sees $200 immediately without typing the code.
//
// Body: { config_slug: 'roqbody' | 'afff' }
//
// Coupon resolution:
//   - Looks up the promo code by its human-readable string "JULY4TH50"
//     via stripe.promotionCodes.list — no coupon ID hardcoded, no
//     dependency on when the promo script ran.
//   - If the promo isn't found (coupon not created yet, expired, or
//     max redemptions hit), we fall back to allow_promotion_codes: true
//     so the buyer can still complete checkout and type it manually.
//     A console warning surfaces the fallback for debugging.

import Stripe from 'stripe';
import { getConfig } from '@/lib/onboarding-configs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';
const PROMO_CODE = 'JULY4TH50';

// Product blurbs per config for the Stripe line item. Copy is intentionally
// generic — the /july4 page is publicly shareable so nothing here names a
// specific client business (that stays inside private /qsetup and /affsetup).
const PRODUCT_COPY: Record<string, { name: string; description: string }> = {
  'presence-full': {
    name: 'GoElev8.AI Setup — Everything Included',
    description:
      'Custom website, AI voice + lead agents, branded SMS, merch storefront, client dashboard, and ongoing management. 50% off with JULY4TH50.',
  },
  'presence-lead': {
    name: 'AI Lead Agent Setup — GoElev8.ai Presence Tier',
    description:
      'Custom AI lead agent on your site, branded SMS follow-up, dashboard, and ongoing management. 50% off with JULY4TH50.',
  },
  'presence-voice': {
    name: 'AI Voice Agent Setup — GoElev8.ai Presence Tier',
    description:
      'Custom 24/7 AI voice agent, calendar booking integration, SMS confirmations, dashboard, and ongoing management. 50% off with JULY4TH50.',
  },
};

export async function POST(req: Request) {
  let body: { config_slug?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const configSlug = body.config_slug ?? '';
  const cfg = getConfig(configSlug);
  const copy = PRODUCT_COPY[configSlug];
  if (!cfg || !copy) {
    return Response.json({ error: 'Unknown config_slug' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  // Resolve the JULY4TH50 promotion code by its human-readable string
  // so the button doesn't need to hardcode the promo_ id.
  let promoId: string | null = null;
  try {
    const list = await stripe.promotionCodes.list({
      code: PROMO_CODE,
      active: true,
      limit: 1,
    });
    promoId = list.data[0]?.id ?? null;
  } catch (err: any) {
    console.error('[july4/checkout] promo lookup threw:', err?.message ?? err);
  }

  if (!promoId) {
    console.warn(
      `[july4/checkout] ${PROMO_CODE} not found or inactive — falling back to allow_promotion_codes so the buyer can enter it manually. Run scripts/create-july4-promo.js if the coupon hasn't been created yet.`,
    );
  }

  try {
    const sessionArgs: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cfg.setupFeeCents,
            product_data: {
              name: copy.name,
              description: copy.description,
            },
          },
        },
      ],
      billing_address_collection: 'auto',
      success_url: `${APP_URL}/onboarding/${cfg.slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/july4`,
      metadata: {
        slug: cfg.slug,
        config_slug: cfg.slug,
        owner_phone: '',
        promo_code: PROMO_CODE,
        tier: cfg.tier ?? cfg.plan,
      },
    };
    if (promoId) {
      sessionArgs.discounts = [{ promotion_code: promoId }];
    } else {
      sessionArgs.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionArgs);
    return Response.json({ url: session.url, session_id: session.id, discount_applied: !!promoId });
  } catch (err: any) {
    console.error('[july4/checkout]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
