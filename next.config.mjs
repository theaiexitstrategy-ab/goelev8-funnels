// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: '/api/apple-pay-verification',
      },
    ];
  },
};

export default nextConfig;
