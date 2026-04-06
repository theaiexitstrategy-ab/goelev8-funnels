// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
  return createClientComponentClient()
}
