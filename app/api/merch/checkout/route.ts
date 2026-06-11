// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/merch/checkout
//   Body: { product_id: string, quantity?: number }
//   Returns: { url: string } — Stripe-hosted Checkout Session URL.
//
// Creates a Stripe Checkout Session for one merch_products row using Stripe
// Connect destination charges:
//   - The platform Stripe account is the merchant of record.
//   - application_fee_amount = base_price * client.platform_fee_pct (defaults to 10%).
//   - transfer_data.destination = client.stripe_connected_account_id.
//
// Requires the seller to have stripe_connected_account_id populated on
// `clients`. Sellers without Connect should keep using merch_products.payment_link
// (handled in the storefront UI, not here).

import { createServiceClient } from '@/lib/db/supabase-service';
import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

export async function POST(req: Request) {
  try {
    const { product_id, quantity: rawQty } = await req.json();
    if (!product_id) {
      return Response.json({ error: 'Missing product_id' }, { status: 400 });
    }
    const quantity = Math.max(1, Math.min(20, Number(rawQty) || 1));

    const supabase = createServiceClient();

    const { data: product } = await supabase
      .from('merch_products')
      .select('id, client_id, product_key, name, description, image_url, base_price_cents, is_active')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id, slug, business_name, name, stripe_connected_account_id, platform_fee_pct')
      .eq('id', product.client_id)
      .single();

    if (!client) {
      return Response.json({ error: 'Seller not found' }, { status: 404 });
    }
    if (!client.stripe_connected_account_id) {
      // Seller hasn't onboarded to Stripe Connect yet. UI should fall back
      // to their existing payment_link if present.
      return Response.json({ error: 'Seller checkout not configured' }, { status: 402 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const feePct = Number(client.platform_fee_pct ?? 10);
    const lineTotal = product.base_price_cents * quantity;
    const applicationFee = Math.round((lineTotal * feePct) / 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'usd',
            unit_amount: product.base_price_cents,
            product_data: {
              name: product.name,
              description: product.description ?? undefined,
              images: product.image_url ? [product.image_url] : undefined,
              metadata: { merch_product_id: product.id, product_key: product.product_key },
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ['US'] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: false },
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: { destination: client.stripe_connected_account_id },
        metadata: {
          merch_client_id: client.id,
          merch_product_id: product.id,
          merch_product_key: product.product_key,
        },
      },
      metadata: {
        merch_client_id: client.id,
        merch_product_id: product.id,
        merch_product_key: product.product_key,
        merch_quantity: String(quantity),
      },
      success_url: `${APP_URL}/store/${client.slug}/order/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/store/${client.slug}`,
    });

    if (!session.url) {
      return Response.json({ error: 'Stripe returned no URL' }, { status: 500 });
    }
    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[merch/checkout]', err?.message ?? err);
    return Response.json(
      { error: err?.message ?? 'Internal error' },
      { status: 500 },
    );
  }
}
