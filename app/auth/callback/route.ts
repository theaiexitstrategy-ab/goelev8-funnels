// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

// Whitelist of safe internal redirect prefixes. Anything else falls
// back to /dashboard (the GoElev8 default) to prevent open-redirect
// abuse via the `?next=` parameter on confirmation links.
const SAFE_NEXT_PREFIXES = ['/dashboard', '/portal', '/hush/app'];

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//')) return '/dashboard';
  if (!SAFE_NEXT_PREFIXES.some((p) => raw === p || raw.startsWith(p + '/') || raw.startsWith(p + '?'))) {
    return '/dashboard';
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback]', error.message);
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
