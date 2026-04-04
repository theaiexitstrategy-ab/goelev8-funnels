// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { product_id, seller_user_id, lead_id, funnel_slug, platform_cut_pct } = pi.metadata;
      if (!product_id || !seller_user_id) break;

      const cutPct = parseInt(platform_cut_pct) || 10;
      const platformCutCents = Math.round(pi.amount * (cutPct / 100));
      const sellerCutCents = pi.amount - platformCutCents;

      await supabase.from('product_sales').insert({
        product_id,
        seller_user_id,
        lead_id: lead_id || null,
        funnel_id: funnel_slug
          ? (await supabase.from('funnels').select('id').eq('slug', funnel_slug).single()).data?.id
          : null,
        amount_cents: pi.amount,
        platform_cut_cents: platformCutCents,
        seller_cut_cents: sellerCutCents,
        stripe_payment_intent_id: pi.id,
        source: 'funnel',
      });

      // Increment total_sold on product
      await supabase.rpc('increment_product_sold', { p_product_id: product_id });
      break;
    }

    case 'checkout.session.completed': {
      // Handle subscription checkout completions
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
