// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'GoElev8.ai — Build Your AI Business Page by Prompt',
    template: '%s | GoElev8.ai',
  },
  description: 'The only page that calls your leads back. AI business pages, SMS follow-up, and phone agents — built from one prompt. Free for 7 days.',
  metadataBase: new URL('https://goelev8.ai'),
  openGraph: {
    title: 'GoElev8.ai — Build Your AI Business Page by Prompt',
    description: 'AI business pages, SMS follow-up, and phone agents — built from one prompt.',
    url: 'https://goelev8.ai',
    siteName: 'GoElev8.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoElev8.ai',
    description: 'Build your AI business page by prompt. Free for 7 days.',
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
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
