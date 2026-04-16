// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';

const ADMIN_EMAIL = 'ab@goelev8.ai';

export async function GET(req: NextRequest) {
  try {
    // Check auth
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);
    const offset = page * limit;

    const service = createServiceClient();

    // Get total count
    const { count } = await service
      .from('vapi_calls')
      .select('*', { count: 'exact', head: true });

    // Get paginated calls
    const { data: calls, error } = await service
      .from('vapi_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[lev-calls] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    return NextResponse.json({
      calls: calls || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[lev-calls] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
