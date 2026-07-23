// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Konquered Balance × goElev8.ai setup + live kocktail booking funnel page.
// Self-contained, no nav/footer chrome. Carries the goelev8.ai homepage
// cyber-noir theme (#000 + cyan #00CFFF + gold #C9A84C, Bebas Neue / DM Sans /
// JetBrains Mono) so the co-brand reads as one system.
//
// This page does double duty: it is the scope-of-work/checkout page Stephen
// Simmons approves, and it is the live kocktail booking funnel demo. The
// primary conversion is a $200 deposit on a kocktail experience — not training.

import KbsetupClient from './KbsetupClient';

export const metadata = {
  title: 'goElev8 × Konquered Balance — Kocktail Booking System',
  description:
    'Turn clicks into booked, paid kocktail experiences on autopilot. Lead capture, automated event booking into portal.goelev8.ai, and $200 Stripe deposits at book.konqueredbalance.com.',
  openGraph: {
    title: 'goElev8 × Konquered Balance — Kocktail Booking System',
    description:
      'Turn clicks into booked, paid kocktail experiences on autopilot. Lead capture, automated event booking, and $200 Stripe deposits.',
    url: 'https://goelev8.ai/kbsetup',
    siteName: 'GoElev8.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'goElev8 × Konquered Balance — Kocktail Booking System',
    description:
      'Turn clicks into booked, paid kocktail experiences on autopilot.',
  },
};

export default function KbsetupPage() {
  return <KbsetupClient />;
}
