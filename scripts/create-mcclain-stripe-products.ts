#!/usr/bin/env npx tsx
// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Seed script for the McClain Law intake agent tiers. For each of Base /
// Growth / Full Scale, creates:
//   - a Product
//   - a recurring monthly Price (the subscription)
//   - a one-time setup Price (charged on the first invoice)
//
// Uses the same findOrCreate* helpers as scripts/setup-stripe-onboarding.ts
// so re-running the script is safe — products and prices are matched by
// name / lookup_key, not created blindly.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/create-mcclain-stripe-products.ts   # test mode
//   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/create-mcclain-stripe-products.ts   # live mode
//
// After running, paste the printed price IDs into Vercel env vars:
//   STRIPE_MCCLAIN_BASE_MONTHLY_PRICE_ID
//   STRIPE_MCCLAIN_BASE_SETUP_PRICE_ID
//   STRIPE_MCCLAIN_GROWTH_MONTHLY_PRICE_ID
//   STRIPE_MCCLAIN_GROWTH_SETUP_PRICE_ID
//   STRIPE_MCCLAIN_FULLSCALE_MONTHLY_PRICE_ID
//   STRIPE_MCCLAIN_FULLSCALE_SETUP_PRICE_ID
//
// The mode (test vs live) is whatever STRIPE_SECRET_KEY is for. The script
// prints which mode it ran in so you don't accidentally ship test IDs.

import Stripe from 'stripe';
import { MCCLAIN_TIERS, formatDollars } from '../lib/mcclain-tiers';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is required.');
  console.error('Run: STRIPE_SECRET_KEY=sk_... npx tsx scripts/create-mcclain-stripe-products.ts');
  process.exit(1);
}

const stripe = new Stripe(key);
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';

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

async function main() {
  console.log(`\n[stripe ${mode}] Setting up McClain Law intake tiers...\n`);

  const rows: {
    tier: string;
    product: Stripe.Product;
    monthly: Stripe.Price;
    setup: Stripe.Price;
  }[] = [];

  for (const tier of Object.values(MCCLAIN_TIERS)) {
    console.log(`\n─── ${tier.name} — ${formatDollars(tier.monthlyCents)}/mo + ${formatDollars(tier.setupCents)} setup ───`);

    const product = await findOrCreateProduct(`McClain Law Intake — ${tier.name}`);

    const monthly = await findOrCreatePrice(tier.monthlyLookupKey, {
      product:     product.id,
      unit_amount: tier.monthlyCents,
      currency:    'usd',
      nickname:    `${tier.name} — Monthly Subscription`,
      recurring:   { interval: 'month' },
    });

    const setup = await findOrCreatePrice(tier.setupLookupKey, {
      product:     product.id,
      unit_amount: tier.setupCents,
      currency:    'usd',
      nickname:    `${tier.name} — One-Time Setup Fee`,
    });

    rows.push({ tier: tier.name, product, monthly, setup });
  }

  // Print paste-friendly env-var block
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`STRIPE ${mode} — McClain intake tiers are ready`);
  console.log('══════════════════════════════════════════════════════════════');
  for (const row of rows) {
    console.log(`\n${row.tier}`);
    console.log(`  product:     ${row.product.id}`);
    console.log(`  monthly:     ${row.monthly.id}`);
    console.log(`  setup:       ${row.setup.id}`);
  }

  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('Paste into Vercel → Settings → Environment Variables:\n');
  const tiersInOrder = Object.values(MCCLAIN_TIERS);
  for (let i = 0; i < tiersInOrder.length; i++) {
    const tier = tiersInOrder[i];
    const row = rows[i];
    console.log(`${tier.monthlyPriceEnv}=${row.monthly.id}`);
    console.log(`${tier.setupPriceEnv}=${row.setup.id}`);
  }
  console.log('\n──────────────────────────────────────────────────────────────');
  console.log(`Mode: ${mode}. To go live, re-run with a sk_live_... key and`);
  console.log(`replace the env vars above in Vercel's production environment.`);
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nSetup failed:');
  console.error(err?.message ?? err);
  process.exit(1);
});
