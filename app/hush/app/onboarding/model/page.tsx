// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ModelForm from './form';

export default async function ModelOnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('role, stage_name, city')
    .eq('id', user.id)
    .maybeSingle();

  if (!hushUser) redirect('/hush/app/onboarding');
  if (hushUser.role !== 'model') redirect(`/hush/app/onboarding/${hushUser.role}`);

  const { data: profile } = await supabase
    .from('hush_profiles')
    .select('ig_handle, of_url')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <ModelForm
      initial={{
        stage_name: hushUser.stage_name ?? '',
        city: hushUser.city ?? '',
        ig_handle: profile?.ig_handle ?? '',
        of_url: profile?.of_url ?? '',
      }}
    />
  );
}
