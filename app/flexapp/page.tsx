// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Branded 2-second intermediate page that redirects to the FLEX
// Facility iOS app on the App Store. Lives on the goelev8.ai
// marketing domain so SMS links like 'goelev8.ai/flexapp' resolve
// cleanly. Server component exports the Open Graph + Twitter Card
// metadata so the link preview renders the Flex brand; a tiny
// client component below handles the spinner + redirect.

import type { Metadata } from 'next';
import FlexAppRedirect from './FlexAppRedirect';

const APP_STORE_URL = 'https://apps.apple.com/us/app/flex-facility/id6755446262';

export const metadata: Metadata = {
  title: 'FLEX Facility App',
  description: 'Download the FLEX Facility training app.',
  // Override the site default canonical so search engines don't
  // think this is a duplicate of goelev8.ai/.
  alternates: { canonical: 'https://goelev8.ai/flexapp' },
  openGraph: {
    title: 'FLEX Facility App',
    description: 'Download the FLEX Facility training app',
    url: 'https://goelev8.ai/flexapp',
    siteName: 'GoElev8.ai',
    type: 'website',
    images: [
      {
        url: 'https://theflexfacility.com/flex-logo.png',
        width: 512,
        height: 512,
        alt: 'The Flex Facility',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLEX Facility App',
    description: 'Download the FLEX Facility training app',
    images: ['https://theflexfacility.com/flex-logo.png'],
  },
};

export default function FlexAppPage() {
  return <FlexAppRedirect appStoreUrl={APP_STORE_URL} />;
}
