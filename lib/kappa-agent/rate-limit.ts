// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Sliding-window limiter for the Kappa Chapter Agent demo. In-memory, so it
// is per serverless instance — enough to stop a runaway tab or a leaked demo
// password from running up API costs, not a hard global quota.

const buckets = new Map<string, number[]>();

export function takeToken(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    // Drop the oldest entries so a flood of sessions can't grow memory unbounded.
    for (const k of Array.from(buckets.keys()).slice(0, 1000)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

export const LIMITS = {
  chat: { max: 30, windowMs: 10 * 60 * 1000 },
  inbound: { max: 30, windowMs: 10 * 60 * 1000 },
  login: { max: 10, windowMs: 10 * 60 * 1000 },
  liveText: { max: 5, windowMs: 60 * 60 * 1000 },
};
