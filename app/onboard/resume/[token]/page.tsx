// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Magic resume link. Looks up the client by their resume_token (which is in
// the receipt email + the post-checkout welcome page CTA), then redirects to
// the step they're on. Phase 2 introduces /onboard/<token>/step/<n>; for now
// we land on a "Phase 2 placeholder" page until those are built.

import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';

type Props = { params: Promise<{ token: string }> };

export const dynamic = 'force-dynamic';

export default async function OnboardResumePage({ params }: Props) {
  const { token } = await params;
  if (!token) notFound();

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, business_name, brand_color, onboarding_status, onboarding_step')
    .eq('resume_token', token)
    .maybeSingle();

  if (!client) notFound();

  // Phase 2 will pick this up and redirect into the multi-step agent.
  // For now, render a holding screen so the email CTA is functional today.
  // Once /onboard/[token]/step/[n] ships, replace this body with:
  //   const next = Math.max(1, Math.min(6, client.onboarding_step + 1));
  //   redirect(`/onboard/${token}/step/${next}`);
  const accent = client.brand_color || '#D4AF7A';
  void redirect; // keep the import warm for Phase 2

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6" style={{ ['--accent' as any]: accent }}>
      <div className="max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: accent }}>
          {client.business_name}
        </p>
        <h1 className="text-3xl md:text-4xl font-light mb-5">
          Welcome back{client.name ? `, ${client.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="text-white/70 mb-3">
          The onboarding agent is shipping next. Your account is paid and ready to go — we&apos;ll email
          you the moment Step 1 is live (or reach out at ab@goelev8.ai and we&apos;ll walk you through it
          personally).
        </p>
        <p className="text-xs text-white/40 mt-8">
          Current status: <strong className="text-white/70">{client.onboarding_status}</strong>{' '}
          (step {client.onboarding_step})
        </p>
      </div>
    </div>
  );
}
