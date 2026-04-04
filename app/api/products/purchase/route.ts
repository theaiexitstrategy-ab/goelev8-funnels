// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';
import { TIER_LIMITS, type Tier } from '@/lib/tiers';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    const { product_id, funnel_slug, lead_id } = await req.json();
    if (!product_id) return Response.json({ error: 'Missing product_id' }, { status: 400 });

    const supabase = createServiceClient();

    // Load product + seller
    const { data: product } = await supabase
      .from('products').select('*, users(*)').eq('id', product_id).eq('is_active', true).single();
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    const seller = product.users as any;

    // Check seller has Stripe Connect connected
    if (!seller.stripe_connect_account_id)
      return Response.json({ error: 'Seller payment not configured' }, { status: 402 });

    // Calculate platform cut based on seller's tier
    const limits = TIER_LIMITS[seller.tier as Tier] || TIER_LIMITS.launch;
    const cutPct = limits.store_cut_pct; // 10 or 8
    const platformCutCents = Math.round(product.price_cents * (cutPct / 100));

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Create PaymentIntent with Connect split
    // Buyer pays full price -> platform takes cut -> seller gets rest automatically
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price_cents,
      currency: 'usd',
      application_fee_amount: platformCutCents,
      transfer_data: { destination: seller.stripe_connect_account_id },
      metadata: {
        product_id, seller_user_id: seller.id,
        lead_id: lead_id || '',
        funnel_slug: funnel_slug || '',
        platform_cut_pct: String(cutPct),
      },
      automatic_payment_methods: { enabled: true }, // Enables Apple Pay, Google Pay, Link
    });

    return Response.json({ client_secret: paymentIntent.client_secret });

  } catch (err) {
    console.error('[products/purchase]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
