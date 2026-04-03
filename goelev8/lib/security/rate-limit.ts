// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
import arcjet, { tokenBucket, shield, detectBot } from '@arcjet/next';

export const publicArcjet = arcjet({ key: process.env.ARCJET_KEY!, rules: [
  shield({ mode: 'LIVE' }),
  detectBot({ mode: 'LIVE', allow: [] }),
  tokenBucket({ mode: 'LIVE', capacity: 20, interval: '1m', refillRate: 10 }),
]});

export const authArcjet = arcjet({ key: process.env.ARCJET_KEY!, rules: [
  shield({ mode: 'LIVE' }),
  detectBot({ mode: 'LIVE', allow: [] }),
  tokenBucket({ mode: 'LIVE', capacity: 5, interval: '15m', refillRate: 1 }),
]});

export const funnelArcjet = arcjet({ key: process.env.ARCJET_KEY!, rules: [
  shield({ mode: 'LIVE' }),
  tokenBucket({ mode: 'LIVE', capacity: 10, interval: '1m', refillRate: 5 }),
]});

export async function applyRateLimit(aj: ReturnType<typeof arcjet>, req: Request) {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return Response.json({ error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } });
  }
  return null; // null = allowed, continue
}
