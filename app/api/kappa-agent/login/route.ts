// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Officer-password gate for the Kappa Chapter Agent demo. Sets a signed,
// httpOnly session cookie; DELETE signs out.

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, checkOfficerPassword, createSessionValue } from '@/lib/kappa-agent/session';
import { LIMITS, takeToken } from '@/lib/kappa-agent/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = takeToken(`login:${ip}`, LIMITS.login.max, LIMITS.login.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  let password: unknown;
  try {
    password = (await req.json())?.password;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  if (!checkOfficerPassword(password)) {
    return NextResponse.json({ error: 'That password isn’t right.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
