// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED  = ['/portal','/api/funnel/generate','/api/domains','/api/products/manage'];
const GROW_ONLY  = ['/portal/sms','/portal/leads','/api/sms/blast'];
const SCALE_ONLY = ['/portal/white-label'];
const ADMIN_ONLY = ['/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Admin: Aaron only
  if (ADMIN_ONLY.some(p => path.startsWith(p))) {
    if (!session || session.user.email !== process.env.ADMIN_EMAIL)
      return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Protected: auth required
  if (PROTECTED.some(p => path.startsWith(p)) && !session)
    return NextResponse.redirect(new URL('/auth/login?next=' + encodeURIComponent(path), req.url));

  // Tier-gated: Grow/Scale only
  if ([...GROW_ONLY, ...SCALE_ONLY].some(p => path.startsWith(p))) {
    if (!session) return NextResponse.redirect(new URL('/auth/login', req.url));
    const { data: user } = await supabase.from('users').select('tier').eq('id', session.user.id).single();
    if (SCALE_ONLY.some(p => path.startsWith(p)) && user?.tier !== 'scale')
      return NextResponse.redirect(new URL('/portal?upgrade=scale', req.url));
    if (GROW_ONLY.some(p => path.startsWith(p)) && !['grow','scale'].includes(user?.tier || ''))
      return NextResponse.redirect(new URL('/portal?upgrade=grow', req.url));
  }

  res.headers.set('X-Request-ID', crypto.randomUUID());
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
