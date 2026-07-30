// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Digital business card at goelev8.ai/businesscard — the URL/QR on Aaron's
// physical card. Mobile-first. Lets someone who just scanned it talk to Lev
// (the live AI demo), book a call, save the contact, and reach the socials.

import BusinessCardClient from './BusinessCardClient';

export const metadata = {
  title: 'Aaron Bryant · GoElev8.ai — Custom AI Agents',
  description:
    'Aaron Bryant, Founder & AI Automation Strategist at GoElev8.ai. Talk to the live AI, book a call, or save my contact.',
  openGraph: {
    title: 'Aaron Bryant · GoElev8.ai',
    description: 'Custom AI agents that answer, qualify & book — 24/7. Talk to the live AI or book a call.',
    url: 'https://goelev8.ai/businesscard',
    siteName: 'GoElev8.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aaron Bryant · GoElev8.ai',
    description: 'Custom AI agents that answer, qualify & book — 24/7.',
  },
};

export default function BusinessCardPage() {
  return <BusinessCardClient />;
}
