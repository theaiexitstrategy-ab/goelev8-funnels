// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// /hush/app/onboarding — role selector. Auth-gated. If the user already
// has a hush_users row, fast-forward to the next onboarding step.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RoleSelector from './role-selector';

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  // If the user already chose a role, skip ahead to the role-specific
  // onboarding step (which itself will skip ahead if profile is complete).
  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (hushUser?.role && hushUser.role !== 'admin') {
    redirect(`/hush/app/onboarding/${hushUser.role}`);
  }

  return <RoleSelector />;
}
