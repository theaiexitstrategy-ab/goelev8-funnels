// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Root "/" — the social-traffic landing page (AI Readiness Score is one
// module among several). The former homepage (pricing / warm pitch) now
// lives at /warm, unchanged. Metadata set here so /warm keeps the root
// layout's default metadata (today's behavior).

import HomeClient from './HomeClient';

export const metadata = {
  title: "GoElev8.ai — What's Your AI Readiness Score?",
  description:
    'The biggest companies on earth are betting everything on AI. Take the free 60-second AI Readiness Score and see how exposed your business is to losing leads — plus claim a free custom AI agent build.',
  openGraph: {
    title: "GoElev8.ai — What's Your AI Readiness Score?",
    description:
      'Take the free 60-second AI Readiness Score. Custom AI agents that answer, qualify, and book — 24/7. Built in St. Louis.',
    url: 'https://goelev8.ai',
    siteName: 'GoElev8.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "GoElev8.ai — What's Your AI Readiness Score?",
    description: 'Take the free 60-second AI Readiness Score. Custom AI agents that answer, qualify & book — 24/7.',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
