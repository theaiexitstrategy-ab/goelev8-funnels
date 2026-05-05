#!/usr/bin/env npx tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// One-shot Stripe setup for the Founding Client offer. Creates:
//   - Product:  "GoElev8.ai Onboarding & Setup"   one-time, $400 list price
//   - Product:  "GoElev8.ai Growth Plan"          $99/month recurring
//   - Coupon:   FOUNDING                           50% off, scoped to setup product
//   - Payment Link: combined checkout for the discounted setup + subscription
//
// Safe to re-run: looks up existing entities by lookup_key / coupon id before
// creating. Re-running ALWAYS creates a fresh Payment Link (links are cheap
// and there's no natural lookup key for them).
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

  // 4) Payment Link: setup + subscription, FOUNDING applied by default.
  // Stripe's hosted checkout will show the $400 list price struck through
  // and the $200 discounted price for the setup line. Subscription line
  // is unaffected because the coupon's applies_to.products excludes it.
  console.log('\nPayment Link:');
  const link = await stripe.paymentLinks.create({
    line_items: [
      { price: setupPrice.id, quantity: 1 },
      { price: subPrice.id,   quantity: 1 },
    ],
    discounts: [{ coupon: coupon.id }],
  });
  console.log(`  + created link:    ${link.id}`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`STRIPE ${mode} — Founding Client offer is ready`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Setup product:        ${setupProduct.id}`);
  console.log(`Setup price ($400):   ${setupPrice.id}  (lookup: goelev8_onboarding_setup_400)`);
  console.log(`Sub product:          ${subProduct.id}`);
  console.log(`Sub price ($99/mo):   ${subPrice.id}  (lookup: goelev8_growth_plan_99_monthly)`);
  console.log(`Coupon:               ${coupon.id}  (50% off setup, "Founding Client Rate")`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`Payment Link URL:`);
  console.log(`  ${link.url}`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nSetup failed:');
  console.error(err.message ?? err);
  process.exit(1);
});
