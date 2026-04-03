// lib/security/csrf.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export function setCSRFCookie(): string {
  const token = randomBytes(32).toString('hex');
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  return token;
}

export function validateCSRF(req: Request): void {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
