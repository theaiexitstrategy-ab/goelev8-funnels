// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/checkout/kbsetup
//   Body: { plan: 'setup' | 'deposit', ...leadFields }
//   Returns: { url: string } — Stripe-hosted Checkout Session URL.
//
// Two very different payments live on /kbsetup, and they land in two
// different Stripe accounts:
//
//   'setup'   — $400 one-time. Stephen Simmons pays goElev8. Straight
//               platform charge on STRIPE_SECRET_KEY, same inline
//               price_data pattern as /qsetup, /affsetup, /july4,
//               /mcclain and /anuday-proposal.
//
//   'deposit' — $200 per event. A guest pays KONQUERED BALANCE, not us.
//               The page promises "you keep 100% of the deposits", so this
//               is a Connect destination charge to Stephen's connected
//               account, with our $10/booking fee taken as the
//               application_fee_amount. Same shape as /api/merch/checkout.
//
// The deposit branch REFUSES to charge until Stephen's connected account is
// configured. Falling back to a plain platform charge would quietly route
// guest deposits into goElev8's balance — money that isn't ours, against a
// promise made in writing on the page. A 402 that the funnel surfaces as
// "deposits aren't connected yet" is the correct failure.

import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

// Stephen's Stripe Connect account (acct_...). Set once he has connected.
// Kept as an env var because Konquered Balance has no `clients` row yet —
// when one exists, prefer reading clients.stripe_connected_account_id.
const KB_ACCOUNT = process.env.KB_STRIPE_CONNECTED_ACCOUNT_ID;

const SETUP_CENTS = 40000;   // $400 one-time build fee
const DEPOSIT_CENTS = 20000; // $200 event deposit
const BOOKING_FEE_CENTS = 1000; // $10 per booked event — our cut of the deposit

/** Trim and hard-cap a free-text field before it goes into Stripe metadata
 *  (Stripe rejects values over 500 chars). */
function meta(value: unknown, max = 200): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const plan = meta(body.plan, 20);
  if (plan !== 'setup' && plan !== 'deposit') {
    return Response.json({ error: 'Unknown plan' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    /* ── $400 setup fee — Stephen → goElev8 ─────────────────────────── */
    if (plan === 'setup') {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: SETUP_CENTS,
              product_data: {
                name: 'Konquered Balance — Kocktail Booking System Setup',
                description:
                  'One-time build: kocktail booking funnel, automated event scheduling into portal.goelev8.ai, $200 Stripe deposit collection, and book.konqueredbalance.com with SSL. Live in 5–7 days.',
              },
            },
          },
        ],
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
        success_url: `${APP_URL}/kbsetup?setup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/kbsetup#pricing`,
        metadata: {
          source: 'kbsetup',
          plan: 'setup',
          business: 'Konquered Balance',
          prepared_for: 'Stephen Simmons',
        },
      });

      if (!session.url) {
        return Response.json({ error: 'Stripe returned no URL' }, { status: 500 });
      }
      return Response.json({ url: session.url, session_id: session.id });
    }

    /* ── $200 event deposit — guest → Konquered Balance ─────────────── */
    if (!KB_ACCOUNT) {
      // Deliberately not falling back to a platform charge. See file header.
      return Response.json(
        {
          error:
            'Deposits aren’t connected yet — Konquered Balance’s Stripe account still needs to be linked.',
        },
        { status: 402 },
      );
    }

    const experience = meta(body.experience) || 'Kocktail experience';
    const when = meta(body.when);
    const name = meta(body.name, 120);
    const email = meta(body.email, 200);
    const phone = meta(body.phone, 40);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: DEPOSIT_CENTS,
            product_data: {
              name: `Konquered Balance — ${experience}`,
              description: when
                ? `$200 deposit holding ${when}. Applied in full to your final event balance.`
                : '$200 deposit holding your event date. Applied in full to your final event balance.',
            },
          },
        },
      ],
      ...(email ? { customer_email: email } : {}),
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        // Our $10/booking fee, taken automatically off the deposit.
        application_fee_amount: BOOKING_FEE_CENTS,
        transfer_data: { destination: KB_ACCOUNT },
        metadata: {
          source: 'kbsetup',
          plan: 'deposit',
          business: 'Konquered Balance',
          experience,
          event_when: when,
          guest_name: name,
          guest_phone: phone,
        },
      },
      metadata: {
        source: 'kbsetup',
        plan: 'deposit',
        business: 'Konquered Balance',
        experience,
        event_when: when,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
      },
      success_url: `${APP_URL}/kbsetup?booked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/kbsetup#funnel`,
    });

    if (!session.url) {
      return Response.json({ error: 'Stripe returned no URL' }, { status: 500 });
    }
    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[checkout/kbsetup]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
