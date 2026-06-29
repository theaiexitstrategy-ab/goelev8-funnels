// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Reusable per-client onboarding configuration. Each new client is one new
// entry — no other code changes needed for the sales page, the Stripe
// Checkout endpoint, the webhook, or the conversational onboarding agent.
//
// Schema extended for the unified provisioning pipeline (roqbody, afff, etc):
//   - feature flags drive which conversational steps the agent runs
//   - pricing / fee fields drive billing math
//   - known_info gives the Claude agent enough context to greet the client
//     intelligently and avoid asking for things we already know

export type OnboardingFeatureFlags = {
  has_lead_agent: boolean;     // step 6 in the agent flow
  has_voice_agent: boolean;    // step 7 in the agent flow
  has_site_build: boolean;     // signals "we owe them a homepage"
  jobber_integration: boolean; // signals downstream Jobber sync
};

export type OnboardingKnownInfo = {
  website?: string;
  location?: string;
  industry?: string;
  services?: string[];
};

export type OnboardingConfig = {
  // ── identity ───────────────────────────────────────────────────────────
  slug: string;            // URL slug: /onboard/<slug>, /onboarding/<slug>
  clientName: string;      // first name (shown to the buyer / agent greeting)
  ownerName?: string;      // full name on the legal/billing record
  businessName: string;    // full brand name
  accentColor: string;     // hex, used as the gold/brand color on the sales page

  // ── plan / pricing ─────────────────────────────────────────────────────
  plan: string;            // value stored on clients.plan
  tier?: string;           // 'presence' | 'visibility' | 'dominance'
  setupFeeCents: number;
  monthlyPriceCents: number;
  // Optional Stripe Price ID for the recurring portion. When set, Checkout
  // uses it directly; when unset we build price_data inline.
  stripeMonthlyPriceId?: string;
  // Fee math for the provisioning agent
  platformFeePct?: number;          // % cut on transactions (e.g. 10 for roqbody)
  transactionFeeFlatCents?: number; // flat fee per booking (e.g. 1000 for afff)
  transactionFeeLabel?: string;     // human-readable fee description for receipts
  smsCreditsIncluded?: number;      // initial balance written into sms_credits

  // ── feature flags ──────────────────────────────────────────────────────
  flags?: OnboardingFeatureFlags;
  knownInfo?: OnboardingKnownInfo;

  // ── sales page copy ────────────────────────────────────────────────────
  normalPriceLabel?: string;     // e.g. "$899" — rendered with line-through
  headline?: string;
  subhead?: string;
  features: string[];
};

// Defaults are conservative so older configs (Leslie) keep working.
const DEFAULT_FLAGS: OnboardingFeatureFlags = {
  has_lead_agent: false,
  has_voice_agent: false,
  has_site_build: false,
  jobber_integration: false,
};

export const ONBOARDING_CONFIGS: Record<string, OnboardingConfig> = {
  'locs-and-wellness': {
    slug: 'locs-and-wellness',
    clientName: 'Leslie',
    businessName: 'The Locs & Wellness Co.',
    accentColor: '#D4AF7A',
    plan: 'tier1',
    tier: 'presence',
    setupFeeCents: 40000,
    monthlyPriceCents: 9900,
    smsCreditsIncluded: 500,
    flags: {
      has_lead_agent: true,
      has_voice_agent: false,
      has_site_build: true,
      jobber_integration: false,
    },
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

  roqbody: {
    slug: 'roqbody',
    clientName: 'Quantarrius',
    ownerName: 'Quantarrius Wilson',
    businessName: 'ROQ Body Academy',
    accentColor: '#F5B800',
    plan: 'presence',
    tier: 'presence',
    setupFeeCents: 40000,
    monthlyPriceCents: 9900,
    platformFeePct: 10,
    transactionFeeLabel:
      '10% of transactions processed through the GoElev8.ai storefront',
    smsCreditsIncluded: 500,
    flags: {
      has_lead_agent: true,
      has_voice_agent: false,
      has_site_build: true,
      jobber_integration: false,
    },
    knownInfo: {
      website: 'roqbody.com',
      location: 'St. Louis, MO',
      industry: 'fitness',
      services: [
        'Personal Training',
        'Online Training',
        'Natural Bodybuilding Programs',
        'ROQ Body Supplements',
        'ROQ Body Apparel',
        'ROQuizine Meal Prep',
        'ROQ Body Jr Academy',
        'ROQ Solid Events',
      ],
    },
    headline: 'ROQ Body × GoElev8.ai',
    features: [
      'Lead Acquisition Agent (Claude-powered)',
      'Branded SMS follow-up',
      'Client dashboard',
      'Homepage audit + site brief',
      'Wix → GoElev8.ai platform migration',
      'Ongoing management',
    ],
  },

  afff: {
    // Placeholder — A Family's Future Heating & Cooling.
    // Real owner details fill in at sales-page time.
    slug: 'afff',
    clientName: '',
    ownerName: '',
    businessName: "A Family's Future Heating & Cooling",
    accentColor: '#C8102E',
    plan: 'presence',
    tier: 'presence',
    setupFeeCents: 40000,
    monthlyPriceCents: 9900,
    platformFeePct: 0,
    transactionFeeFlatCents: 1000, // $10 per booked appointment via Jobber
    transactionFeeLabel: '$10 per booked appointment via Jobber',
    smsCreditsIncluded: 500,
    flags: {
      has_lead_agent: false,
      has_voice_agent: true,
      has_site_build: false,
      jobber_integration: true,
    },
    knownInfo: {
      industry: 'hvac',
      location: 'St. Louis, MO',
    },
    headline: "A Family's Future × GoElev8.ai",
    features: [
      'Voice answering agent (Vapi)',
      'Branded SMS follow-up',
      'Jobber integration',
      'Client dashboard',
      'Ongoing management',
    ],
  },
};

export function getConfig(slug: string): OnboardingConfig | null {
  return ONBOARDING_CONFIGS[slug] ?? null;
}

export function getFlags(cfg: OnboardingConfig): OnboardingFeatureFlags {
  return { ...DEFAULT_FLAGS, ...(cfg.flags ?? {}) };
}
