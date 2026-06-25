// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Post-Stripe-Checkout welcome page. Stripe redirects buyers here with their
// Checkout Session id in the URL. The webhook fires asynchronously, so the
// clients row may not yet exist — we degrade gracefully.
// Theme matches goelev8.ai (black + cyan + Bebas Neue + DM Sans).

import { createServiceClient } from '@/lib/db/supabase-service';

export const dynamic = 'force-dynamic';

const CYAN = '#00CFFF';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';
const DISPLAY_FONT = '"Bebas Neue", sans-serif';

type Props = { params: Promise<{ sessionId: string }> };

export default async function OnboardStartPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = createServiceClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, business_name, resume_token')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  const ready = !!client;

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col"
      style={{ fontFamily: BODY_FONT, fontWeight: 300 }}
    >
      <header className="px-6 py-4 max-w-6xl mx-auto w-full">
        <a href="/" className="inline-flex items-center" aria-label="GoElev8.ai home">
          <img
            src="/images/goelev8-full-logo.png"
            alt="GoElev8.ai — Infinite Possibilities"
            width={60}
            height={60}
            style={{ display: 'block' }}
          />
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-xl w-full text-center">
          <p
            className="mb-4 text-[11px] uppercase"
            style={{ color: CYAN, letterSpacing: '2.5px', fontFamily: BODY_FONT, fontWeight: 600 }}
          >
            Payment confirmed
          </p>

          {ready ? (
            <>
              <h1
                className="mb-5 uppercase"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 'clamp(40px, 6vw, 64px)',
                  letterSpacing: '1.5px',
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                You&apos;re in{client.name ? `, ${client.name.split(' ')[0]}` : ''}.
              </h1>
              <p
                className="text-white/65 mb-10"
                style={{ fontSize: 17, lineHeight: 1.6 }}
              >
                Welcome to GoElev8.ai. Your onboarding starts now — we&apos;ll get to know your business so we can build something that feels like you.
              </p>
              <a
                href={`/onboard/resume/${client.resume_token}`}
                className="inline-block py-4 px-8 rounded-sm hover:brightness-110 transition-all text-black"
                style={{
                  background: CYAN,
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  fontSize: 14,
                  textTransform: 'uppercase',
                }}
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
              <h1
                className="mb-5 uppercase"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  letterSpacing: '1.5px',
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                Finishing up your account…
              </h1>
              <p className="text-white/65 mb-6" style={{ fontSize: 16, lineHeight: 1.6 }}>
                Stripe accepted your payment. We&apos;re finalizing your account in the background — this usually takes a few seconds. Refresh the page, or check your email for the receipt + onboarding link.
              </p>
              <p className="text-xs text-white/40">
                Reference:{' '}
                <code className="bg-white/5 px-2 py-1 rounded text-white/60">
                  {sessionId.slice(0, 24)}…
                </code>
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-white/40 pb-8">
        &copy; 2026{' '}
        <a href="https://goelev8.ai" className="hover:text-white/70">
          GoElev8.ai
        </a>
      </footer>
    </div>
  );
}
