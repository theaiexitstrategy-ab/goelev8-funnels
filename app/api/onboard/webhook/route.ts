// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Stripe webhook for the client onboarding checkout flow. Distinct from
// /api/stripe/webhook and /api/merch/webhook so it gets its own dedicated
// signing secret (STRIPE_ONBOARD_WEBHOOK_SECRET).
//
// Configure in Stripe → Developers → Webhooks → Add endpoint
//   URL:    https://www.goelev8.ai/api/onboard/webhook
//   Events: checkout.session.completed
//
// On checkout.session.completed:
//   1. Pull metadata.onboarding_slug to identify the config
//   2. Idempotent insert/update of a clients row keyed on the Checkout
//      Session id, populated with stripe customer/sub ids + onboarding state
//   3. Fire the branded receipt email via Resend (skipped silently if the
//      Resend key isn't configured — payment still goes through cleanly)

import Stripe from 'stripe';
import { createServiceClient } from '@/lib/db/supabase-service';
import { getConfig } from '@/lib/onboarding-configs';
import { sendReceiptEmail } from '@/lib/onboarding-email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 });

  const secret =
    process.env.STRIPE_ONBOARD_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET; // fallback while the dedicated secret is being added
  if (!secret) {
    console.error('[onboard/webhook] No webhook secret configured');
    return Response.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[onboard/webhook] Signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
  } catch (err: any) {
    console.error(`[onboard/webhook] handler error for ${event.type}:`, err?.message ?? err);
    // Stripe will retry on 500.
    return Response.json({ error: 'handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(sessionLite: Stripe.Checkout.Session) {
  const slug = sessionLite.metadata?.onboarding_slug;
  if (!slug) return; // ignore non-onboarding sessions

  const cfg = getConfig(slug);
  if (!cfg) {
    console.error('[onboard/webhook] Unknown onboarding slug in metadata:', slug);
    return;
  }

  const supabase = createServiceClient();

  // Idempotency: skip if we already created this client row.
  const { data: existing } = await supabase
    .from('clients')
    .select('id, resume_token, email')
    .eq('stripe_checkout_session_id', sessionLite.id)
    .maybeSingle();
  if (existing) {
    console.log('[onboard/webhook] session already processed:', sessionLite.id);
    return;
  }

  // Pull customer details + subscription id from a fully expanded session.
  const session = await stripe.checkout.sessions.retrieve(sessionLite.id, {
    expand: ['customer', 'subscription', 'customer_details'],
  });

  const customer = session.customer && typeof session.customer !== 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;
  const customerId = typeof session.customer === 'string' ? session.customer : customer?.id ?? null;

  const email =
    session.customer_details?.email ??
    (customer && 'email' in customer ? (customer as any).email : null) ??
    null;
  const name =
    session.customer_details?.name ??
    (customer && 'name' in customer ? (customer as any).name : null) ??
    null;

  // Derive a slug-friendly client identifier; collision tolerant via timestamp.
  const baseSlug = cfg.slug;
  const uniqueSlug = `${baseSlug}-${sessionLite.id.slice(-8)}`;

  const insertRow: Record<string, unknown> = {
    slug:               uniqueSlug,
    name:               name ?? cfg.clientName,
    business_name:      cfg.businessName,
    email,
    brand_color:        cfg.accentColor,
    plan:               cfg.plan,
    tier:               cfg.plan,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id: sessionLite.id,
    paid_at:            new Date().toISOString(),
    onboarding_status:  'started',
    onboarding_step:    0,
    onboarding_config_slug: cfg.slug,
  };

  const { data: inserted, error: insErr } = await supabase
    .from('clients')
    .insert(insertRow)
    .select('id, resume_token')
    .single();

  if (insErr) {
    console.error('[onboard/webhook] clients insert failed:', insErr.message);
    throw insErr;
  }

  console.log('[onboard/webhook] client created:', inserted.id, 'session=', sessionLite.id);

  // Receipt email — best effort. If Resend isn't configured we still 200
  // the webhook so Stripe doesn't keep retrying.
  if (email) {
    const { error: emailErr, id: emailId } = await sendReceiptEmail({
      to: email,
      customerName: name,
      cfg,
      resumeToken: inserted.resume_token,
    });
    if (emailErr) console.error('[onboard/webhook] receipt email error:', emailErr);
    else console.log('[onboard/webhook] receipt email sent:', emailId);
  } else {
    console.warn('[onboard/webhook] no email on session — skipping receipt');
  }
}
