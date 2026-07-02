// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// July 4th 2026 promo page. Two buttons — buyer picks ROQ Body Setup or
// AFF HVAC Setup — each starts a Stripe Checkout Session with the
// JULY4TH50 coupon auto-applied so the buyer sees $200 immediately.

import July4Client from './July4Client';

export const metadata = {
  title: 'July 4th 50% Off — GoElev8.AI',
  description: 'GoElev8.AI — Infinite Possibilities with AI',
};

export default function July4Page() {
  return <July4Client />;
}
