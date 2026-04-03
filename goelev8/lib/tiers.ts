// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

export const TIER_LIMITS = {
  trial: {
    funnels: 1, leads_per_month: 50,
    ai_agent: false, live_demo: false, sms_blast: false,
    portal: false, chat_widget: true, product_store: false,
    custom_domain: false, white_label: false,
    store_cut_pct: 10, sms_enabled: true,
  },
  launch: {
    funnels: 1, leads_per_month: 250,
    ai_agent: false, live_demo: false, sms_blast: false,
    portal: false, chat_widget: true, product_store: true,
    custom_domain: false, white_label: false,
    store_cut_pct: 10, sms_enabled: true,
  },
  grow: {
    funnels: 3, leads_per_month: 1000,
    ai_agent: true, live_demo: true, sms_blast: true,
    portal: true, chat_widget: true, product_store: true,
    custom_domain: true, white_label: false,
    store_cut_pct: 10, sms_enabled: true,
  },
  scale: {
    funnels: 999, leads_per_month: 999999,
    ai_agent: true, live_demo: true, sms_blast: true,
    portal: true, chat_widget: true, product_store: true,
    custom_domain: true, white_label: true,
    store_cut_pct: 8, sms_enabled: true,
  },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export const SMS_CREDIT_TIERS = [
  { amount_usd: 25,  credits: 250,  rate: 0.10 },
  { amount_usd: 50,  credits: 625,  rate: 0.08 },
  { amount_usd: 100, credits: 2000, rate: 0.05 },
] as const;
// Credits NEVER expire. No monthly SMS fee.
// Warn at 50 credits. At 0: pause sequences + send Resend alert.

export function getPlanFromPriceId(priceId: string): Tier {
  const map: Record<string, Tier> = {
    [process.env.STRIPE_PRICE_LAUNCH_MONTHLY!]: 'launch',
    [process.env.STRIPE_PRICE_LAUNCH_ANNUAL!]:  'launch',
    [process.env.STRIPE_PRICE_GROW_MONTHLY!]:   'grow',
    [process.env.STRIPE_PRICE_GROW_ANNUAL!]:    'grow',
    [process.env.STRIPE_PRICE_SCALE_MONTHLY!]:  'scale',
    [process.env.STRIPE_PRICE_SCALE_ANNUAL!]:   'scale',
  };
  return map[priceId] || 'launch';
}
