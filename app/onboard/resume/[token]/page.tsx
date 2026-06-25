// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Magic resume link. Looks up the client by their resume_token and sends
// them to the step they're up to (capped at 6) — or the completion page
// if they're done.

import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';
import { TOTAL_STEPS } from '@/lib/onboarding-steps';

type Props = { params: Promise<{ token: string }> };

export const dynamic = 'force-dynamic';

export default async function OnboardResumePage({ params }: Props) {
  const { token } = await params;
  if (!token) notFound();

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, onboarding_status, onboarding_step')
    .eq('resume_token', token)
    .maybeSingle();
  if (!client) notFound();

  if (client.onboarding_status === 'complete') {
    redirect(`/onboard/agent/${token}/complete`);
  }

  const next = Math.max(1, Math.min(TOTAL_STEPS, (client.onboarding_step ?? 0) + 1));
  redirect(`/onboard/agent/${token}/step/${next}`);
}
