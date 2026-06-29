// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/smscalc/checkout
//   Creates a one-time Stripe Checkout Session for an SMS credit pack
//   selected on the /smscalc page. The actual credit grant happens in the
//   /api/webhooks/stripe handler when checkout.session.completed fires.
//
// Body: { pack_id: 'starter' | 'growth' | 'pro' | 'elite', client_slug?: string }
//
// If client_slug is omitted, the webhook will try to match the Stripe
// customer email to an existing clients row. If neither matches, Aaron
// gets notified and applies the credits manually.

import Stripe from 'stripe';
import { getPack, totalCreditsForPack } from '@/lib/sms-packs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

export async function POST(req: Request) {
  let body: { pack_id?: string; client_slug?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Allow empty body — pack_id may also come via query string
  }
  const url = new URL(req.url);
  const packId = body.pack_id ?? url.searchParams.get('pack_id') ?? '';
  const clientSlug = body.client_slug ?? url.searchParams.get('client_slug') ?? '';

  const pack = getPack(packId);
  if (!pack) {
    return Response.json({ error: 'Invalid pack_id' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    const totalCredits = totalCreditsForPack(pack);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      // Force email collection so the webhook can match to a clients row.
      customer_creation: 'always',
      billing_address_collection: 'auto',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: pack.priceCents,
            product_data: {
              name: `${pack.name} SMS Credit Pack — GoElev8.ai`,
              description:
                pack.bonus > 0
                  ? `${pack.credits.toLocaleString()} credits + ${pack.bonus.toLocaleString()} bonus = ${totalCredits.toLocaleString()} total. Credits never expire.`
                  : `${pack.credits.toLocaleString()} credits. Credits never expire.`,
            },
          },
        },
      ],
      success_url: `${APP_URL}/smscalc/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/smscalc`,
      metadata: {
        type: 'sms_pack',
        pack_id: pack.id,
        pack_credits: String(totalCredits),
        client_slug: clientSlug, // empty string when buyer didn't supply
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[smscalc/checkout]', err?.message ?? err);
    return Response.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
