// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Wraps every promoter screen with the persistent bottom nav and gates
// access by role. If the visitor isn't signed in or hasn't picked the
// promoter role yet, they're routed back to the appropriate step.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PromoterBottomNav from './_nav/PromoterBottomNav';

export default async function PromoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!hushUser) redirect('/hush/app/onboarding');
  if (hushUser.role !== 'promoter' && hushUser.role !== 'admin') {
    // Wrong role — bounce them to their own home.
    if (hushUser.role === 'guest') redirect('/hush/app/feed');
    if (hushUser.role === 'model') redirect('/hush/app/profile');
    redirect('/hush/app/onboarding');
  }

  return (
    <div className="relative min-h-screen pb-[88px] pt-safe">
      {children}
      <PromoterBottomNav />
    </div>
  );
}
