// app/auth/callback/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL('/auth/login?error=auth_callback_failed', requestUrl.origin)
      );
    }

    if (session?.user) {
      // Check if the user has any funnels
      const { data: funnels } = await supabase
        .from('funnels')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (funnels && funnels.length > 0) {
        return NextResponse.redirect(new URL('/portal', requestUrl.origin));
      } else {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }
    }
  }

  // Fallback: redirect to login if no code present
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
