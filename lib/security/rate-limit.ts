// lib/security/rate-limit.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import arcjet, { tokenBucket, fixedWindow } from '@arcjet/next';

export const publicArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({ mode: 'LIVE', window: '60s', max: 60 }),
  ],
});

export const authArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({ mode: 'LIVE', window: '60s', max: 10 }),
  ],
});

export const funnelArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({ mode: 'LIVE', window: '60s', max: 30 }),
  ],
});

export async function applyRateLimit(aj: any, req: Request): Promise<Response | null> {
  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  return null;
}
