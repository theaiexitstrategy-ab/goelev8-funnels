// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Signed-cookie session for the Kappa Chapter Agent demo (/kappa/agent).
// Uses Web Crypto only, so it runs in both the Edge middleware and Node
// route handlers.

export const SESSION_COOKIE = 'kappa_agent_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret(): string {
  return (
    process.env.KAPPA_DEMO_SECRET ||
    process.env.ANTHROPIC_API_KEY ||
    'kappa-demo-local-only'
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = '';
  new Uint8Array(bytes).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('kappa-agent-session:' + secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(): Promise<string> {
  const sid = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${sid}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

/** Returns the session id when the cookie is valid and unexpired. */
export async function verifySessionValue(value: string | undefined | null): Promise<string | null> {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [sid, exp, sig] = parts;
  if (!/^[0-9a-f-]{36}$/.test(sid) || !/^\d+$/.test(exp)) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const expected = await sign(`${sid}.${exp}`);
  return safeEqual(sig, expected) ? sid : null;
}

export function checkOfficerPassword(input: unknown): boolean {
  const expected = process.env.KAPPA_AGENT_PASSWORD || 'officer1911';
  return typeof input === 'string' && safeEqual(input.trim(), expected);
}
