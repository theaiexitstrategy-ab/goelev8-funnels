// lib/tiers.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export const TIER_LIMITS = {
  trial:     { leads_per_month: 25,   sms_enabled: true,  ai_calls: false, products: 0,  funnels: 1 },
  launch:    { leads_per_month: 100,  sms_enabled: true,  ai_calls: false, products: 0,  funnels: 1 },
  grow:      { leads_per_month: 500,  sms_enabled: true,  ai_calls: true,  products: 10, funnels: 3 },
  scale:     { leads_per_month: 2000, sms_enabled: true,  ai_calls: true,  products: 50, funnels: 10 },
  cancelled: { leads_per_month: 0,    sms_enabled: false, ai_calls: false, products: 0,  funnels: 0 },
} as const;

export function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_LAUNCH_MONTHLY!]: 'launch',
    [process.env.STRIPE_PRICE_GROW_MONTHLY!]:   'grow',
    [process.env.STRIPE_PRICE_SCALE_MONTHLY!]:  'scale',
  };
  return map[priceId] || 'launch';
}

export const SMS_CREDIT_TIERS = [
  { credits: 100,  amount_usd: 5 },
  { credits: 250,  amount_usd: 10 },
  { credits: 500,  amount_usd: 18 },
  { credits: 1000, amount_usd: 30 },
] as const;
