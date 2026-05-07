// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

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

export default nextConfig;
