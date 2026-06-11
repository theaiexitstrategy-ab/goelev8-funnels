// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Stripe webhook for merch checkout. Distinct from /api/stripe/webhook so the
// merch flow can have its own dedicated endpoint in the Stripe dashboard with
// its own signing secret (STRIPE_MERCH_WEBHOOK_SECRET).
//
// Configure in Stripe → Developers → Webhooks → Add endpoint
//   URL:    https://www.goelev8.ai/api/merch/webhook
//   Events: checkout.session.completed, charge.refunded
// Then paste the signing secret into Vercel as STRIPE_MERCH_WEBHOOK_SECRET.
//
// On checkout.session.completed:
//   - Idempotent insert into merch_orders (status='paid') keyed on
//     stripe_payment_id = session.id.
//   - Insert one merch_order_items row per Stripe line item.
//
// On charge.refunded:
//   - Mark the matching merch_orders row as status='refunded'.

import { createServiceClient } from '@/lib/db/supabase-service';
import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 });

  const secret =
    process.env.STRIPE_MERCH_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET; // fallback while the merch secret is being added
  if (!secret) {
    console.error('[merch/webhook] No webhook secret configured');
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[merch/webhook] Signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'charge.refunded') {
      await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
    }
  } catch (err: any) {
    console.error(`[merch/webhook] handler error for ${event.type}:`, err?.message ?? err);
    // Return 500 so Stripe retries.
    return Response.json({ error: 'handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(supabase: SupabaseClient, sessionLite: Stripe.Checkout.Session) {
  // Only act on merch checkouts.
  const clientId = sessionLite.metadata?.merch_client_id;
  if (!clientId) return; // ignore non-merch sessions

  // Idempotency: skip if we already recorded this session.
  const { data: existing } = await supabase
    .from('merch_orders')
    .select('id')
    .eq('stripe_payment_id', sessionLite.id)
    .maybeSingle();
  if (existing) return;

  // Re-fetch with line items expanded so we can record items.
  const session = await stripe.checkout.sessions.retrieve(sessionLite.id, {
    expand: ['line_items.data.price.product', 'customer_details', 'shipping_details'],
  });

  const customerEmail = session.customer_details?.email ?? null;
  const customerName  = session.customer_details?.name  ?? null;
  const customerPhone = session.customer_details?.phone ?? null;
  const shipping      = (session as any).shipping_details ?? (session as any).shipping ?? null;
  const addr          = shipping?.address ?? null;

  const subtotalCents = (session.amount_subtotal ?? session.amount_total ?? 0) as number;
  const totalCents    = (session.amount_total    ?? 0) as number;
  const shippingCents = (session.shipping_cost?.amount_total ?? 0) as number;
  const taxCents      = (session.total_details?.amount_tax ?? 0) as number;
  const discountCents = (session.total_details?.amount_discount ?? 0) as number;

  // Pull the application fee + Stripe fee from the PaymentIntent → Charge.
  let platformFeeCents = 0;
  let stripeFeeCents   = 0;
  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge.balance_transaction'] });
      platformFeeCents = (pi.application_fee_amount as number | null) ?? 0;
      const charge = pi.latest_charge as Stripe.Charge | null;
      const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null;
      if (bt && typeof bt !== 'string') {
        stripeFeeCents = bt.fee ?? 0;
      }
    } catch (err) {
      console.error('[merch/webhook] could not fetch PI for fees:', err);
    }
  }

  const orderRow = {
    client_id:         clientId,
    customer_name:     customerName,
    customer_email:    customerEmail,
    customer_phone:    customerPhone,
    shipping_address1: addr?.line1 ?? null,
    shipping_address2: addr?.line2 ?? null,
    shipping_city:     addr?.city ?? null,
    shipping_state:    addr?.state ?? null,
    shipping_zip:      addr?.postal_code ?? null,
    shipping_country:  addr?.country ?? null,
    subtotal_cents:    subtotalCents,
    shipping_cents:    shippingCents,
    discount_cents:    discountCents,
    total_cents:       totalCents,
    platform_fee_cents: platformFeeCents,
    stripe_fee_cents:   stripeFeeCents,
    stripe_payment_id:  session.id,
    status:             'paid',
  };

  const { data: inserted, error: insErr } = await supabase
    .from('merch_orders')
    .insert(orderRow)
    .select('id')
    .single();
  if (insErr) throw insErr;

  const orderId = inserted.id as string;

  // Line items. Stripe gives us a price/product per line; we fall back to
  // metadata.merch_product_id we stamped at checkout time.
  const lineItems = session.line_items?.data ?? [];
  const fallbackProductKey = session.metadata?.merch_product_key ?? null;

  const itemsRows = lineItems.map((li) => {
    const price = li.price as Stripe.Price | null;
    const product = price?.product as Stripe.Product | null;
    const productKey =
      (product?.metadata as any)?.product_key ??
      (price?.metadata as any)?.product_key ??
      fallbackProductKey ??
      'unknown';
    return {
      order_id:    orderId,
      product_key: productKey,
      name:        li.description ?? product?.name ?? 'Product',
      quantity:    li.quantity ?? 1,
      price_cents: price?.unit_amount ?? 0,
      size:        (product?.metadata as any)?.size ?? null,
      color:       (product?.metadata as any)?.color ?? null,
    };
  });

  if (itemsRows.length > 0) {
    const { error: itemErr } = await supabase.from('merch_order_items').insert(itemsRows);
    if (itemErr) throw itemErr;
  }
}

async function handleChargeRefunded(supabase: SupabaseClient, charge: Stripe.Charge) {
  // Walk back to the checkout session via the PaymentIntent.
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
  const sessionId = sessions.data[0]?.id;
  if (!sessionId) return;
  await supabase
    .from('merch_orders')
    .update({ status: 'refunded' })
    .eq('stripe_payment_id', sessionId);
}
