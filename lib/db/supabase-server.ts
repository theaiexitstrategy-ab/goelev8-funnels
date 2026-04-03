// lib/db/supabase-server.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function createServerClient() {
  return createServerComponentClient({ cookies });
}
