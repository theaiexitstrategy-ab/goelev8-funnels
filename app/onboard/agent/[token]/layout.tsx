// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared shell for /onboard/<token>/* — goelev8.ai-themed wrapper around
// the step pages. Real GoElev8 logo, Bebas Neue display + DM Sans body,
// cyan #00CFFF accent.

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';
import OnboardingHeader from './OnboardingHeader';

type Props = { children: React.ReactNode; params: Promise<{ token: string }> };

const BODY_FONT = '"DM Sans", system-ui, sans-serif';

export default async function OnboardTokenLayout({ children, params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, business_name, onboarding_step, onboarding_status')
    .eq('resume_token', token)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col"
      style={{ fontFamily: BODY_FONT, fontWeight: 300 }}
    >
      <OnboardingHeader token={token} businessName={client.business_name || ''} />
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10">{children}</main>
      <footer className="text-center text-xs text-white/40 pb-10">
        &copy; 2026{' '}
        <a href="https://goelev8.ai" className="hover:text-white/70">
          GoElev8.ai
        </a>
      </footer>
    </div>
  );
}
