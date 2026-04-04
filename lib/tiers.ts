// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export type Tier = 'free' | 'launch' | 'grow' | 'scale';

export const TIER_LIMITS: Record<Tier, {
  funnels: number;
  leads_per_month: number;
  sms_per_month: number;
  custom_domain: boolean;
  store_cut_pct: number;
  products: number;
}> = {
  free: {
    funnels: 1,
    leads_per_month: 50,
    sms_per_month: 0,
    custom_domain: false,
    store_cut_pct: 15,
    products: 3,
  },
  launch: {
    funnels: 3,
    leads_per_month: 500,
    sms_per_month: 500,
    custom_domain: true,
    store_cut_pct: 10,
    products: 25,
  },
  grow: {
    funnels: 10,
    leads_per_month: 2000,
    sms_per_month: 2000,
    custom_domain: true,
    store_cut_pct: 10,
    products: 100,
  },
  scale: {
    funnels: 50,
    leads_per_month: 10000,
    sms_per_month: 10000,
    custom_domain: true,
    store_cut_pct: 8,
    products: 500,
  },
};
