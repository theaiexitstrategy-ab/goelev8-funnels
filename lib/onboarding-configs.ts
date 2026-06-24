// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Reusable per-client onboarding configuration. Each new client is one
// new entry — no other code changes needed for the sales page, the
// Stripe Checkout endpoint, or the receipt email to work.

export type OnboardingConfig = {
  slug: string;            // URL slug: /onboard/<slug>
  clientName: string;      // First name shown to the buyer ("Leslie")
  businessName: string;    // Full brand name
  accentColor: string;     // Hex, used as the gold/brand color on the sales page
  plan: string;            // Stored on clients.plan
  setupFeeCents: number;
  monthlyPriceCents: number;
  // Optional Stripe Price ID for the recurring portion. When set, Checkout
  // uses that price_id directly; when unset, we build price_data inline
  // from monthlyPriceCents.
  stripeMonthlyPriceId?: string;
  // Display strings on the sales page
  normalPriceLabel?: string;     // e.g. "$899" — rendered with line-through
  headline?: string;
  subhead?: string;
  features: string[];
};

export const ONBOARDING_CONFIGS: Record<string, OnboardingConfig> = {
  'locs-and-wellness': {
    slug: 'locs-and-wellness',
    clientName: 'Leslie',
    businessName: 'The Locs & Wellness Co.',
    accentColor: '#D4AF7A',
    plan: 'tier1',
    setupFeeCents: 40000,
    monthlyPriceCents: 9900,
    normalPriceLabel: '$899',
    headline: 'Your digital presence, built for you.',
    subhead:
      'Everything you need to get found, look professional, and book more clients — hands-free.',
    features: [
      'Custom website design & build',
      'Domain purchase & setup',
      'Merch shop setup (shop.goelev8.ai/[client])',
      'Multi-tenant client portal access',
      'iSlay Studios keyword network (SEO boost)',
      'GlossGenius booking integration',
      'Ongoing site maintenance',
    ],
  },
};

export function getConfig(slug: string): OnboardingConfig | null {
  return ONBOARDING_CONFIGS[slug] ?? null;
}
