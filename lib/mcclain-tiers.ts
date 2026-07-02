// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Canonical tier definitions for the McClain Law intake agent offering.
// Single source of truth for:
//   - The pricing cards on /mcclain/demo
//   - The Stripe seed script (scripts/create-mcclain-stripe-products.ts)
//   - The Checkout Session route (/api/checkout/mcclain)
//   - The webhook branch that logs completions
//
// Stripe Price IDs are read from env vars at runtime so the same code
// works in test vs live mode — the seed script prints the IDs, you paste
// them into Vercel, done.

export type McclainTierKey = 'base' | 'growth' | 'fullscale';

export type McclainTier = {
  key: McclainTierKey;
  name: string;
  monthlyCents: number;
  setupCents: number;
  // lookup_keys used in the seed script so re-runs are idempotent
  monthlyLookupKey: string;
  setupLookupKey: string;
  // env vars the checkout route reads to find the Stripe Price IDs
  monthlyPriceEnv: string;
  setupPriceEnv: string;
  // human-friendly bullets shown on the page (matches the demo mockup)
  bullets: string[];
  featured?: boolean;
};

export const MCCLAIN_TIERS: Record<McclainTierKey, McclainTier> = {
  base: {
    key: 'base',
    name: 'Base',
    monthlyCents: 14700,
    setupCents: 49700,
    monthlyLookupKey: 'mcclain_intake_base_monthly_14700',
    setupLookupKey: 'mcclain_intake_base_setup_49700',
    monthlyPriceEnv: 'STRIPE_MCCLAIN_BASE_MONTHLY_PRICE_ID',
    setupPriceEnv: 'STRIPE_MCCLAIN_BASE_SETUP_PRICE_ID',
    bullets: [
      'Instant lead response',
      'Qualification questions',
      'Direct calendar booking',
    ],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    monthlyCents: 29700,
    setupCents: 99700,
    monthlyLookupKey: 'mcclain_intake_growth_monthly_29700',
    setupLookupKey: 'mcclain_intake_growth_setup_99700',
    monthlyPriceEnv: 'STRIPE_MCCLAIN_GROWTH_MONTHLY_PRICE_ID',
    setupPriceEnv: 'STRIPE_MCCLAIN_GROWTH_SETUP_PRICE_ID',
    bullets: [
      'Everything in Base',
      'Auto-routing across attorneys',
      '48–72hr follow-up nurture',
    ],
    featured: true,
  },
  fullscale: {
    key: 'fullscale',
    name: 'Full Scale',
    monthlyCents: 49700,
    setupCents: 149700,
    monthlyLookupKey: 'mcclain_intake_fullscale_monthly_49700',
    setupLookupKey: 'mcclain_intake_fullscale_setup_149700',
    monthlyPriceEnv: 'STRIPE_MCCLAIN_FULLSCALE_MONTHLY_PRICE_ID',
    setupPriceEnv: 'STRIPE_MCCLAIN_FULLSCALE_SETUP_PRICE_ID',
    bullets: [
      'Everything in Growth',
      'Case status text updates',
      'Client-facing automation',
    ],
  },
};

export function getMcclainTier(key: string): McclainTier | null {
  return (MCCLAIN_TIERS as Record<string, McclainTier>)[key] ?? null;
}

export function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  });
}
