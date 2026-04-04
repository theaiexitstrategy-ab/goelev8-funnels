// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import arcjet, { tokenBucket, fixedWindow } from '@arcjet/next';

export const publicArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({ mode: 'LIVE', window: '60s', max: 20 }),
  ],
});

export const funnelArcjet = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({ mode: 'LIVE', window: '60s', max: 10 }),
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function applyRateLimit(aj: any, req: Request) {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }
    return null;
  } catch {
    return null;
  }
}
