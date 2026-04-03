// app/portal/layout.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/db/supabase-server';
import PortalShell from './portal-shell';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  const { data: user } = await supabase
    .from('users')
    .select('id, email, tier, sms_credits, trial_ends_at')
    .eq('id', session.user.id)
    .single();

  if (!user) redirect('/auth/login');

  // Check if any funnel has vapi or twilio
  const { data: funnels } = await supabase
    .from('funnels')
    .select('vapi_assistant_id, twilio_number, a2p_status')
    .eq('user_id', user.id);

  const hasVapi = funnels?.some((f) => !!f.vapi_assistant_id) ?? false;
  const hasTwilio = funnels?.some((f) => !!f.twilio_number) ?? false;
  const a2pStatus: string =
    funnels?.find((f) => f.a2p_status)?.a2p_status ?? 'pending';

  return (
    <PortalShell
      email={user.email}
      tier={user.tier}
      smsCredits={user.sms_credits}
      trialEndsAt={user.trial_ends_at}
      hasVapi={hasVapi}
      hasTwilio={hasTwilio}
      a2pStatus={a2pStatus}
    >
      {children}
    </PortalShell>
  );
}
