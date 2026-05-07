// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush PWA root layout. This layout owns everything under /hush/app/* —
// the goelev8.ai/hush marketing splash (static HTML rewrite) is unaffected.
// Tailwind is loaded only here, so utilities never bleed into the rest of
// the goelev8-funnels app.

import type { Metadata, Viewport } from 'next';
import './styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Hush AI',
    template: '%s | Hush AI',
  },
  description: 'Find the party. Own the night.',
  manifest: '/hush/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hush AI',
  },
  icons: {
    apple: '/hush/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#C9A84C',
  viewportFit: 'cover',
};

export default function HushAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-hush-black text-hush-white font-outfit">{children}</div>;
}
