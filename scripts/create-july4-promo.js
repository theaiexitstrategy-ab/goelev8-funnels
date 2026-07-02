// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// One-off: create a Stripe Coupon + Promotion Code for the July 4th 2026
// setup fee promotion.
//
//   Coupon: 50% off, one-time (duration: "once"), name "July4th50"
//   Promo:  code "JULY4TH50", max_redemptions 25, expires
//           2026-07-07 23:59 America/Chicago, no first-time-transaction
//           restriction
//
// The coupon is NOT scoped to a specific product because the goelev8-funnels
// checkouts (qsetup, affsetup, onboard) mint their setup-fee line items
// inline via price_data — there is no persistent Stripe Product/Price ID
// to attach applies_to.products to. The code is only surfaced on the
// setup-fee flows so it's effectively scoped that way in practice.
//
// Usage:
//   node scripts/create-july4-promo.js
//
// Requires STRIPE_SECRET_KEY in .env, .env.local, or the shell environment.

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// ── Load STRIPE_SECRET_KEY from local env files if present ──
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const repoRoot = path.resolve(__dirname, '..');
loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(repoRoot, '.env.local'));

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error(
    'Missing STRIPE_SECRET_KEY.\n' +
      '  Add it to .env, .env.local, or run with:\n' +
      '  STRIPE_SECRET_KEY=sk_live_... node scripts/create-july4-promo.js',
  );
  process.exit(1);
}
const modeLabel = secret.startsWith('sk_live_')
  ? 'LIVE'
  : secret.startsWith('sk_test_')
    ? 'TEST'
    : 'UNKNOWN';
console.log(`Using Stripe key in ${modeLabel} mode.`);

const stripe = new Stripe(secret);

// ── Expiration: July 7 2026 23:59 America/Chicago (CDT, UTC-5) ──
// CDT in July is UTC-5, so 23:59 CDT July 7 → 04:59 UTC July 8.
const EXPIRES_AT_UNIX = Math.floor(Date.UTC(2026, 6, 8, 4, 59, 0) / 1000);

async function main() {
  console.log('\n── Creating coupon ──');
  const coupon = await stripe.coupons.create({
    percent_off: 50,
    duration: 'once',
    name: 'July4th50',
  });
  console.log('  coupon.id:', coupon.id);

  console.log('\n── Creating promotion code ──');
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: 'JULY4TH50',
    max_redemptions: 25,
    expires_at: EXPIRES_AT_UNIX,
    restrictions: {
      first_time_transaction: false,
    },
  });
  console.log('  promotion_code.id:', promo.id);

  // ── Fetch back to confirm it's live ──
  console.log('\n── Fetching back for confirmation ──');
  const live = await stripe.promotionCodes.retrieve(promo.id, {
    expand: ['coupon'],
  });
  const expDate = new Date(live.expires_at * 1000);
  console.log('  code:               ', live.code);
  console.log('  active:             ', live.active);
  console.log('  coupon.id:          ', live.coupon.id);
  console.log('  coupon.name:        ', live.coupon.name);
  console.log('  percent_off:        ', live.coupon.percent_off, '%');
  console.log('  duration:           ', live.coupon.duration);
  console.log('  max_redemptions:    ', live.max_redemptions);
  console.log('  times_redeemed:     ', live.times_redeemed);
  console.log('  expires_at (UTC):   ', expDate.toISOString());
  console.log(
    '  expires_at (CT):    ',
    expDate.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  );
  console.log(
    '  first_time_only:    ',
    live.restrictions?.first_time_transaction ?? false,
  );

  console.log('\n✅ Promo code is live in Stripe. Share code JULY4TH50.');
}

main().catch((err) => {
  console.error('\n❌ Script failed:', err?.message ?? err);
  if (err?.raw) console.error('  Stripe error:', err.raw);
  process.exit(1);
});
