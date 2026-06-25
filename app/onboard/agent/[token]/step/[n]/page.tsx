// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Single server route that loads the client + existing client_info + any
// uploaded assets, and dispatches to the appropriate step component.

import { notFound, redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';
import { STEP_INTROS, TOTAL_STEPS } from '@/lib/onboarding-steps';
import StepForm from './StepForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string; n: string }> };

export default async function OnboardStepPage({ params }: Props) {
  const { token, n: nRaw } = await params;
  const n = Math.max(1, Math.min(TOTAL_STEPS, Number(nRaw) || 1));

  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, business_name, brand_color, onboarding_step, onboarding_status')
    .eq('resume_token', token)
    .maybeSingle();
  if (!client) notFound();
  if (client.onboarding_status === 'complete') {
    redirect(`/onboard/agent/${token}/complete`);
  }

  const intro = STEP_INTROS[n - 1];
  const CYAN = '#00CFFF';
  const firstName = (client.name || '').split(' ')[0] || '';

  const { data: info } = await supabase
    .from('client_info')
    .select('*')
    .eq('client_id', client.id)
    .maybeSingle();

  const { data: assets } = await supabase
    .from('client_assets')
    .select('id, file_url, file_type, label, page_position, rank, uploaded_at')
    .eq('client_id', client.id)
    .order('page_position', { ascending: true })
    .order('rank', { ascending: true });

  return (
    <div>
      <p
        className="mb-3 text-[11px] uppercase"
        style={{ color: CYAN, letterSpacing: '2.5px', fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
      >
        {intro.title}
      </p>
      <h2
        className="mb-4 uppercase"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(28px, 4vw, 42px)',
          letterSpacing: '1.5px',
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        {intro.title}
      </h2>
      <p className="text-white/75 text-lg mb-8 leading-relaxed">
        {intro.agentSays(firstName)}
      </p>

      <StepForm
        n={n as 1 | 2 | 3 | 4 | 5 | 6}
        token={token}
        accent={CYAN}
        info={info ?? null}
        assets={(assets ?? []) as any[]}
      />
    </div>
  );
}
