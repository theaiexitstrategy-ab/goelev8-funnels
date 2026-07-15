// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set([
  '/',
  '/pricing',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/privacy',
  '/terms',
  '/sms-policy',
  '/portal',
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/f/')) return true;
  if (pathname.startsWith('/book/')) return true;
  if (pathname.startsWith('/store/')) return true;
  if (pathname.startsWith('/onboard/')) return true;
  if (pathname.startsWith('/onboarding/')) return true;
  if (pathname.startsWith('/qsetup')) return true;
  if (pathname.startsWith('/affsetup')) return true;
  if (pathname.startsWith('/smscalc')) return true;
  if (pathname.startsWith('/roq')) return true;
  if (pathname.startsWith('/july4')) return true;
  if (pathname.startsWith('/mcclain')) return true;
  if (pathname.startsWith('/anudaydemo')) return true;
  if (pathname.startsWith('/anuday-proposal')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/images/')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check entirely for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Guard: if env vars are missing, let the request through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Authenticated user hitting auth pages → redirect to dashboard
  if (user && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protected routes: anything starting with /dashboard
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
