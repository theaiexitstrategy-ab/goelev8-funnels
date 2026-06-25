// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Onboarding complete confirmation page.

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';

export const dynamic = 'force-dynamic';

const CYAN = '#00CFFF';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';
const DISPLAY_FONT = '"Bebas Neue", sans-serif';

type Props = { params: Promise<{ token: string }> };

export default async function OnboardingCompletePage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, business_name')
    .eq('resume_token', token)
    .maybeSingle();
  if (!client) notFound();

  const firstName = (client.name || '').split(' ')[0] || '';

  return (
    <div className="text-center py-10" style={{ fontFamily: BODY_FONT }}>
      <div className="text-5xl mb-6">🎉</div>
      <p
        className="mb-3 text-[11px] uppercase"
        style={{ color: CYAN, letterSpacing: '2.5px', fontWeight: 600 }}
      >
        Onboarding complete
      </p>
      <h1
        className="mb-4 uppercase"
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 'clamp(34px, 5vw, 56px)',
          letterSpacing: '1.5px',
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        You&apos;re all set{firstName ? `, ${firstName}` : ''}!
      </h1>
      <p className="text-white/70 max-w-md mx-auto mb-10" style={{ fontSize: 16, lineHeight: 1.6 }}>
        We&apos;ll have your site live within{' '}
        <strong className="text-white">5 business days</strong>.
        {client.email ? (
          <>
            {' '}
            We&apos;ll email you at{' '}
            <strong className="text-white">{client.email}</strong> with updates.
          </>
        ) : null}
      </p>
      <p className="text-xs text-white/40">
        Questions in the meantime?{' '}
        <a
          href="mailto:ab@goelev8.ai"
          className="underline hover:text-white"
          style={{ color: CYAN }}
        >
          ab@goelev8.ai
        </a>
      </p>
    </div>
  );
}
