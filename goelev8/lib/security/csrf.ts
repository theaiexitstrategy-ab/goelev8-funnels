// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';

const CSRF_COOKIE = 'ge8_csrf';
const CSRF_HEADER = 'x-csrf-token';

export function setCSRFCookie(): string {
  const token = randomBytes(32).toString('hex');
  cookies().set(CSRF_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600, path: '/',
  });
  return token;
}

export function validateCSRF(req: Request): void {
  const cookie = cookies().get(CSRF_COOKIE)?.value;
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header) throw new Error('Missing CSRF token');
  try {
    if (!timingSafeEqual(Buffer.from(cookie), Buffer.from(header)))
      throw new Error('CSRF mismatch');
  } catch { throw new Error('CSRF validation failed'); }
}
