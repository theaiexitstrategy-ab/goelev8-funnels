#!/usr/bin/env npx tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// One-shot Stripe setup for every GoElev8.ai checkout flow:
//
//   Founding Client offer:
//     - Product:      "GoElev8.ai Onboarding & Setup"   one-time, $400
//     - Product:      "GoElev8.ai Growth Plan"          $99/month recurring
//     - Coupon:       FOUNDING                           50% off, scoped to setup
//     - Payment Link: combined checkout, FOUNDING applied
//
//   Standard tiers (homepage pricing — Starter / Growth / Pro):
//     - For each tier: setup product + monthly product + payment link
//     - Setup amounts:    Starter $300 · Growth $400 · Pro $600
//     - Monthly amounts:  Starter $127 · Growth $197 · Pro $297
//
// Safe to re-run: products / prices look up by lookup_key, coupon by id, and
// payment links by metadata.goelev8_tier — so the script is fully idempotent
// and Payment Link URLs stay stable across runs (paste them into Vercel env
// once and forget).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_live_or_test npx tsx scripts/setup-stripe-onboarding.ts
//
// IMPORTANT: the API mode (test vs live) is whatever your STRIPE_SECRET_KEY
// is for. The script prints which mode it ran in so you don't accidentally
// publish a test-mode link.

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is required.');
  console.error('Run: STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe-onboarding.ts');
  process.exit(1);
}

const stripe = new Stripe(key);
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';

// ─── Helpers ──────────────────────────────────────────────────────

async function findOrCreateProduct(name: string): Promise<Stripe.Product> {
  const search = await stripe.products.search({
    query: `name:'${name.replace(/'/g, "\\'")}' AND active:'true'`,
    limit: 1,
  });
  if (search.data.length) {
    console.log(`  ↻ reusing product: ${search.data[0].id} — ${name}`);
    return search.data[0];
  }
  const created = await stripe.products.create({ name });
  console.log(`  + created product: ${created.id} — ${name}`);
  return created;
}

async function findOrCreatePrice(
  lookupKey: string,
  params: Stripe.PriceCreateParams,
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (list.data.length) {
    console.log(`  ↻ reusing price:   ${list.data[0].id} — ${lookupKey}`);
    return list.data[0];
  }
  const created = await stripe.prices.create({ ...params, lookup_key: lookupKey });
  console.log(`  + created price:   ${created.id} — ${lookupKey}`);
  return created;
}

async function findOrCreateCoupon(
  id: string,
  params: Stripe.CouponCreateParams,
): Promise<Stripe.Coupon> {
  try {
    const existing = await stripe.coupons.retrieve(id);
    console.log(`  ↻ reusing coupon:  ${existing.id} — ${existing.name ?? '(no name)'}`);
    return existing;
  } catch (err) {
    const code = (err as Stripe.errors.StripeError).code;
    if (code !== 'resource_missing') throw err;
  }
  const created = await stripe.coupons.create({ id, ...params });
  console.log(`  + created coupon:  ${created.id} — ${created.name ?? '(no name)'}`);
  return created;
}

// Stripe doesn't index Payment Links by lookup_key, but the metadata field
// is queryable client-side. We tag each link with `goelev8_tier=<slug>` so
// re-runs reuse the same URL instead of generating a new one.
async function findOrCreatePaymentLink(
  tierSlug: string,
  params: Stripe.PaymentLinkCreateParams,
): Promise<Stripe.PaymentLink> {
  for await (const pl of stripe.paymentLinks.list({ active: true, limit: 100 })) {
    if (pl.metadata?.goelev8_tier === tierSlug) {
      console.log(`  ↻ reusing link:    ${pl.id} (tier=${tierSlug})`);
      return pl;
    }
  }
  const merged: Stripe.PaymentLinkCreateParams = {
    ...params,
    metadata: { ...(params.metadata ?? {}), goelev8_tier: tierSlug },
  };
  const created = await stripe.paymentLinks.create(merged);
  console.log(`  + created link:    ${created.id} (tier=${tierSlug})`);
  return created;
}

// ─── Standard tier configs (homepage pricing) ─────────────────────

type TierConfig = {
  slug: string;        // metadata tag, lower-case
  display: string;     // human name for product titles
  setupAmount: number; // cents
  monthlyAmount: number; // cents
};

const STANDARD_TIERS: TierConfig[] = [
  { slug: 'starter', display: 'Starter', setupAmount: 30000, monthlyAmount: 12700 },
  { slug: 'growth',  display: 'Growth',  setupAmount: 40000, monthlyAmount: 19700 },
  { slug: 'pro',     display: 'Pro',     setupAmount: 60000, monthlyAmount: 29700 },
];

async function setupTier(t: TierConfig): Promise<Stripe.PaymentLink> {
  console.log(`\n${t.display} tier:`);

  const setupProduct = await findOrCreateProduct(`GoElev8.ai ${t.display} — Setup`);
  const setupPrice = await findOrCreatePrice(`goelev8_${t.slug}_setup`, {
    product:     setupProduct.id,
    unit_amount: t.setupAmount,
    currency:    'usd',
    nickname:    `${t.display} Setup`,
  });

  const monthlyProduct = await findOrCreateProduct(`GoElev8.ai ${t.display} Plan`);
  const monthlyPrice = await findOrCreatePrice(`goelev8_${t.slug}_plan_monthly`, {
    product:     monthlyProduct.id,
    unit_amount: t.monthlyAmount,
    currency:    'usd',
    nickname:    `${t.display} — Monthly`,
    recurring:   { interval: 'month' },
  });

  return findOrCreatePaymentLink(t.slug, {
    line_items: [
      { price: setupPrice.id, quantity: 1 },
      { price: monthlyPrice.id, quantity: 1 },
    ],
  });
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`\n[stripe ${mode}] Setting up Founding Client offer...\n`);

  // 1) One-time setup product + price
  console.log('Setup fee:');
  const setupProduct = await findOrCreateProduct('GoElev8.ai Onboarding & Setup');
  const setupPrice = await findOrCreatePrice('goelev8_onboarding_setup_400', {
    product:     setupProduct.id,
    unit_amount: 40000, // $400.00
    currency:    'usd',
    nickname:    'Founding Client Rate',
  });

  // 2) Recurring subscription product + price
  console.log('\nGrowth Plan:');
  const subProduct = await findOrCreateProduct('GoElev8.ai Growth Plan');
  const subPrice = await findOrCreatePrice('goelev8_growth_plan_99_monthly', {
    product:     subProduct.id,
    unit_amount: 9900, // $99.00
    currency:    'usd',
    nickname:    'Growth Plan — Monthly',
    recurring:   { interval: 'month' },
  });

  // 3) FOUNDING coupon — 50% off, scoped to the setup product only
  // applies_to.products restricts which line items the coupon discounts.
  // Without this, the discount would also hit the $99/mo subscription.
  console.log('\nCoupon:');
  const coupon = await findOrCreateCoupon('FOUNDING', {
    name:        'Founding Client Rate',
    percent_off: 50,
    duration:    'once',
    applies_to:  { products: [setupProduct.id] },
  });

  // 4) Founding Payment Link: setup + subscription, FOUNDING applied by default.
  // Stripe's hosted checkout shows the $400 list price struck through and the
  // $200 discounted price for the setup line. Subscription is unaffected
  // because the coupon's applies_to.products excludes it. Tagged with
  // metadata.goelev8_tier=founding so re-runs reuse the same URL.
  console.log('\nFounding Payment Link:');
  const foundingLink = await findOrCreatePaymentLink('founding', {
    line_items: [
      { price: setupPrice.id, quantity: 1 },
      { price: subPrice.id,   quantity: 1 },
    ],
    discounts: [{ coupon: coupon.id }],
  });

  // 5) Standard tier payment links (homepage pricing — Starter / Growth / Pro)
  console.log('\n────────────────────────────────────────');
  console.log('Standard tier payment links:');
  console.log('────────────────────────────────────────');
  const tierLinks: Record<string, Stripe.PaymentLink> = {};
  for (const t of STANDARD_TIERS) {
    tierLinks[t.slug] = await setupTier(t);
  }

  // 6) Print everything in a paste-friendly format
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`STRIPE ${mode} — All payment links ready`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('Founding offer:');
  console.log(`  ${foundingLink.url}`);
  console.log('');
  console.log('Standard tiers:');
  console.log(`  Starter:  ${tierLinks.starter.url}`);
  console.log(`  Growth:   ${tierLinks.growth.url}`);
  console.log(`  Pro:      ${tierLinks.pro.url}`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log('Paste these into Vercel → Project → Settings → Environment Variables');
  console.log('(Production scope), then redeploy:');
  console.log('');
  console.log(`NEXT_PUBLIC_STRIPE_LINK_STARTER=${tierLinks.starter.url}`);
  console.log(`NEXT_PUBLIC_STRIPE_LINK_GROWTH=${tierLinks.growth.url}`);
  console.log(`NEXT_PUBLIC_STRIPE_LINK_PRO=${tierLinks.pro.url}`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nSetup failed:');
  console.error(err.message ?? err);
  process.exit(1);
});
