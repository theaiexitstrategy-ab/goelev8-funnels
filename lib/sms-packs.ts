// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Canonical SMS credit pack definitions. Single source of truth for:
//   - the /smscalc UI (display)
//   - the /api/smscalc/checkout endpoint (price + Stripe product copy)
//   - the /api/webhooks/stripe handler (credit math after purchase)
//
// Add a pack here and the whole stack picks it up.

export type SmsPackId = 'starter' | 'growth' | 'pro' | 'elite';

export type SmsPack = {
  id: SmsPackId;
  name: string;
  priceCents: number;
  credits: number;
  bonus: number;
};

export const SMS_PACKS: Record<SmsPackId, SmsPack> = {
  starter: { id: 'starter', name: 'Starter', priceCents: 2500,  credits: 500,   bonus: 0 },
  growth:  { id: 'growth',  name: 'Growth',  priceCents: 6000,  credits: 1500,  bonus: 200 },
  pro:     { id: 'pro',     name: 'Pro',     priceCents: 17500, credits: 5000,  bonus: 1000 },
  elite:   { id: 'elite',   name: 'Elite',   priceCents: 30000, credits: 10000, bonus: 2500 },
};

export function getPack(id: string): SmsPack | null {
  return (SMS_PACKS as Record<string, SmsPack>)[id] ?? null;
}

export function totalCreditsForPack(p: SmsPack): number {
  return p.credits + p.bonus;
}
