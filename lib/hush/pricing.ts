// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush pricing & business-logic constants. Single source of truth for
// subscription tiers, platform cuts, credit packs, boost costs.
//
// Env-overridable values (HUSH_SERVICE_FEE_*, HUSH_TICKET_CUT_PERCENT,
// etc.) should be read from process.env at call sites — this module
// holds the static defaults.

export type PromoterTier = 'hustle' | 'pro' | 'mogul';

export const HUSH_PRICING = {
  plans: {
    hustle: {
      price: 49,
      credits: 100,
      smsIncluded: 200,
      name: 'Hustle',
      numberType: 'shared' as const,
      creditRollover: false,
    },
    pro: {
      price: 99,
      credits: 300,
      smsIncluded: 500,
      name: 'Pro',
      numberType: 'dedicated' as const,
      creditRollover: true,
      rolloverMax: 600,
    },
    mogul: {
      price: 199,
      credits: 750,
      smsIncluded: 1000,
      name: 'Mogul',
      numberType: 'dedicated' as const,
      creditRollover: true,
      rolloverMax: 1500,
      networkAccess: true,
    },
  },

  serviceFee: (ticketPrice: number): number => {
    if (ticketPrice < 30) return 2.5;
    if (ticketPrice <= 75) return 4.99;
    if (ticketPrice <= 150) return 7.99;
    return ticketPrice * 0.1;
  },

  ticketCut: 0.03,
  bookingFee: 0.1,
  streamModelCut: 0.7,
  streamHushCut: 0.2,
  streamPromoterCut: 0.1,
  tipModelCut: 0.7,
  tipHushCut: 0.3,

  creditPacks: [
    { credits: 100, price: 9.99, id: 'starter' },
    { credits: 300, price: 24.99, id: 'standard' },
    { credits: 750, price: 49.99, id: 'pro' },
    { credits: 2000, price: 99.99, id: 'elite' },
  ],

  boosts: {
    event24h: 50,
    event7d: 200,
    cityBlast: 100,
    cityExpansion: 150,
    modelSpotPriority: 75,
    modelProfile24h: 50,
    modelVideoAutoplay: 30,
    modelApplicationPriority: 40,
    modelCityExpansion: 150,
    guestWhoGoingHighlight: 25,
    guestVipUpgrade: 75,
    guestWaitlistPriority: 35,
  },

  modelUnlock: 500,
  streamPrices: [5, 10, 15, 25] as const,
  streamCreditAccess: 50,
} as const;
