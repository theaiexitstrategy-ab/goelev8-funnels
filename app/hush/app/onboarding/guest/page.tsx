// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GuestForm from './form';

export default async function GuestOnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('role, city')
    .eq('id', user.id)
    .maybeSingle();

  // No role yet → bounce back to the role picker.
  if (!hushUser) redirect('/hush/app/onboarding');
  if (hushUser.role !== 'guest') redirect(`/hush/app/onboarding/${hushUser.role}`);

  const { data: profile } = await supabase
    .from('hush_profiles')
    .select('display_name, ig_handle, tt_handle, sc_handle, x_handle')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <GuestForm
      initial={{
        display_name: profile?.display_name ?? '',
        city: hushUser.city ?? '',
        ig_handle: profile?.ig_handle ?? '',
        tt_handle: profile?.tt_handle ?? '',
        sc_handle: profile?.sc_handle ?? '',
        x_handle: profile?.x_handle ?? '',
      }}
    />
  );
}
