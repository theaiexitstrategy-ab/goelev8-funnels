// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PromoterForm from './form';

export default async function PromoterOnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('role, tier')
    .eq('id', user.id)
    .maybeSingle();

  if (!hushUser) redirect('/hush/app/onboarding');
  if (hushUser.role !== 'promoter') redirect(`/hush/app/onboarding/${hushUser.role}`);

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('brand_name, keyword_prefix')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <PromoterForm
      initial={{
        brand_name: promoter?.brand_name ?? '',
        keyword_prefix: promoter?.keyword_prefix ?? '',
        plan:
          hushUser.tier === 'pro' || hushUser.tier === 'mogul'
            ? hushUser.tier
            : 'hustle',
      }}
    />
  );
}
