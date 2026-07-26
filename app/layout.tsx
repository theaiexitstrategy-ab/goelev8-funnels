// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'GoElev8.ai — Custom AI Agents That Answer, Book & Follow Up',
    template: '%s | GoElev8.ai',
  },
  description: 'GoElev8.ai designs, builds, and runs custom AI agents that answer every call and text, qualify leads, and book appointments 24/7 — done for you, live in 48 hours.',
  metadataBase: new URL('https://goelev8.ai'),
  openGraph: {
    title: 'GoElev8.ai — Custom AI Agents That Answer, Book & Follow Up',
    description: 'GoElev8.ai designs, builds, and runs custom AI agents that answer every call and text, qualify leads, and book appointments 24/7 — done for you, live in 48 hours.',
    url: 'https://goelev8.ai',
    siteName: 'GoElev8.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoElev8.ai — Custom AI Agents That Answer, Book & Follow Up',
    description: 'GoElev8.ai designs, builds, and runs custom AI agents that answer every call and text, qualify leads, and book appointments 24/7 — done for you, live in 48 hours.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
