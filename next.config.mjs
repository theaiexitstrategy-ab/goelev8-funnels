// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
