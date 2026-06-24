// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Post-Stripe-Checkout welcome page. Stripe redirects buyers here with their
// Checkout Session id in the URL. The webhook fires asynchronously, so the
// clients row may not yet exist — we degrade gracefully and ask the buyer
// to check their email if so.

import { createServiceClient } from '@/lib/db/supabase-service';
import { getConfig } from '@/lib/onboarding-configs';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ sessionId: string }> };

export default async function OnboardStartPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = createServiceClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, business_name, brand_color, resume_token, onboarding_config_slug')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  const cfg = client?.onboarding_config_slug ? getConfig(client.onboarding_config_slug) : null;
  const accent = client?.brand_color || cfg?.accentColor || '#D4AF7A';
  const ready = !!client;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ ['--accent' as any]: accent }}>
      <header className="px-6 py-5 max-w-3xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/80 hover:text-white">
          <span className="font-bold" style={{ color: accent }}>GO</span>
          <span className="font-extralight">ELEV8.AI</span>
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-xl w-full text-center">
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: accent }}>
            Payment confirmed
          </p>

          {ready ? (
            <>
              <h1 className="text-4xl md:text-5xl font-light mb-5">
                You&apos;re in{client.name ? `, ${client.name.split(' ')[0]}` : ''}.
              </h1>
              <p className="text-lg text-white/70 mb-10">
                Welcome to GoElev8.ai. Your onboarding starts now — we&apos;ll get to know your business so
                we can build something that feels like you.
              </p>
              <a
                href={`/onboard/resume/${client.resume_token}`}
                className="inline-block py-4 px-8 rounded font-medium text-black uppercase tracking-widest text-sm hover:brightness-110 transition-all"
                style={{ background: accent }}
              >
                Start Onboarding →
              </a>
              <p className="text-xs text-white/40 mt-8">
                We also emailed your receipt + a link to come back to this anytime
                {client.email ? <> at <strong className="text-white/70">{client.email}</strong></> : null}.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-light mb-5">Finishing up your account…</h1>
              <p className="text-white/70 mb-6">
                Stripe accepted your payment. We&apos;re finalizing your account in the background — this usually
                takes a few seconds. Refresh the page, or check your email for the receipt + onboarding link.
              </p>
              <p className="text-xs text-white/40">
                Reference: <code className="bg-white/5 px-2 py-1 rounded text-white/60">{sessionId.slice(0, 24)}…</code>
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-white/40 pb-8">
        &copy; 2026 <a href="https://goelev8.ai" className="hover:text-white/70">GoElev8.ai</a>
      </footer>
    </div>
  );
}
