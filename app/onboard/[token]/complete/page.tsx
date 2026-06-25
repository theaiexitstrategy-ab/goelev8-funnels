// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Onboarding complete confirmation page.

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export default async function OnboardingCompletePage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, business_name, brand_color')
    .eq('resume_token', token)
    .maybeSingle();
  if (!client) notFound();

  const accent = client.brand_color || '#D4AF7A';
  const firstName = (client.name || '').split(' ')[0] || '';

  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-6">🎉</div>
      <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: accent }}>
        Onboarding complete
      </p>
      <h1 className="text-3xl md:text-4xl font-light mb-4">
        You&apos;re all set{firstName ? `, ${firstName}` : ''}!
      </h1>
      <p className="text-white/70 max-w-md mx-auto mb-10">
        We&apos;ll have your site live within <strong className="text-white">5 business days</strong>.
        {client.email ? (
          <> We&apos;ll email you at <strong className="text-white">{client.email}</strong> with updates.</>
        ) : null}
      </p>
      <p className="text-xs text-white/40">
        Questions in the meantime?{' '}
        <a href="mailto:ab@goelev8.ai" className="text-white/60 hover:text-white underline">ab@goelev8.ai</a>
      </p>
    </div>
  );
}
