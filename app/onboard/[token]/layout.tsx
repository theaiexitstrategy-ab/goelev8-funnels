// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared shell for /onboard/<token>/* — logo + step counter + Save My Spot.
// Step pages render inside `children`.

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';
import OnboardingHeader from './OnboardingHeader';

type Props = { children: React.ReactNode; params: Promise<{ token: string }> };

export default async function OnboardTokenLayout({ children, params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, business_name, brand_color, onboarding_step, onboarding_status')
    .eq('resume_token', token)
    .maybeSingle();

  if (!client) notFound();

  const accent = client.brand_color || '#D4AF7A';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ ['--accent' as any]: accent }}>
      <OnboardingHeader
        token={token}
        accent={accent}
        businessName={client.business_name || ''}
      />
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
