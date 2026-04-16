// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export type Tier = 'starter' | 'growth' | 'pro';

export const TIER_LIMITS: Record<Tier, {
  sms_per_month: number;
  vapi_minutes_per_month: number;
  sms_overage: number;
  vapi_overage: number;
  setup_fee: number;
  monthly_price: number;
  has_vapi: boolean;
}> = {
  starter: {
    sms_per_month: 300,
    vapi_minutes_per_month: 0,
    sms_overage: 0.05,
    vapi_overage: 0,
    setup_fee: 300,
    monthly_price: 127,
    has_vapi: false,
  },
  growth: {
    sms_per_month: 600,
    vapi_minutes_per_month: 60,
    sms_overage: 0.05,
    vapi_overage: 0.15,
    setup_fee: 400,
    monthly_price: 197,
    has_vapi: true,
  },
  pro: {
    sms_per_month: 1200,
    vapi_minutes_per_month: 120,
    sms_overage: 0.05,
    vapi_overage: 0.15,
    setup_fee: 600,
    monthly_price: 297,
    has_vapi: true,
  },
};
