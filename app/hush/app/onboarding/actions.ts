'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type HushRole = 'guest' | 'promoter' | 'model';

const ROLE_DESTINATION: Record<HushRole, string> = {
  guest: '/hush/app/onboarding/guest',
  promoter: '/hush/app/onboarding/promoter',
  model: '/hush/app/onboarding/model',
};

/**
 * Pick a Hush role. Creates the hush_users row (idempotent — upsert) and
 * redirects to the role-specific onboarding form.
 */
export async function pickRole(role: HushRole) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { error } = await supabase
    .from('hush_users')
    .upsert({ id: user.id, role }, { onConflict: 'id' });

  if (error) {
    console.error('[hush/onboarding] pickRole failed:', error);
    throw new Error('Could not save your role. Try again.');
  }

  redirect(ROLE_DESTINATION[role]);
}
