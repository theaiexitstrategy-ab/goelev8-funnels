// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import withPWAInit from 'next-pwa';

// PWA is scoped to /hush/ so the service worker never interferes with
// goelev8.ai homepage, portal, or any other existing route. Service worker
// is built into prod bundles but not auto-registered — registration is
// done manually from app/hush/app/layout.tsx once the PWA is ready.
const withPWA = withPWAInit({
  dest: 'public/hush',
  sw: 'sw.js',
  scope: '/hush/',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'hush-supabase-cache' },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'hush-fonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs before the public/ filesystem check, so rewrite
      // destinations resolve to static .html files in public/.
      beforeFiles: [
        // goelev8.ai/willpower → static index page.
        // (book.goelev8.ai/willpower lives in the separate goelev8-book project.)
        {
          source: '/willpower',
          destination: '/willpower-index.html',
        },
        // goelev8.ai/hush → HushSTL demo landing page.
        // The Hush PWA app itself lives at /hush/app/* (handled by App Router,
        // not this rewrite). The marketing splash and the PWA coexist.
        {
          source: '/hush',
          destination: '/hush-index.html',
        },
      ],
      afterFiles: [
        {
          source: '/.well-known/apple-developer-merchantid-domain-association',
          destination: '/api/apple-pay-verification',
        },
        // Matches book.goelev8.ai (canonical) and any Scale-tier CNAME alias
        // that follows the `book.<clientdomain>` convention — e.g.
        // book.danielslegacyplanning.com. A single regex keeps primary site
        // traffic (goelev8.ai, www.goelev8.ai, *.vercel.app, localhost) unaffected.
        {
          source: '/:slug',
          destination: '/book/:slug',
          has: [
            { type: 'host', value: '(?<bookhost>book\\..+)' },
          ],
        },
      ],
      fallback: [],
    };
  },
};

export default withPWA(nextConfig);
