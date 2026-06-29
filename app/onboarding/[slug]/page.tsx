// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Conversational onboarding agent UI. Lives at /onboarding/[slug].
//
// Accepts either:
//   ?token=<uuid>         → direct resume link (what Aaron sends clients)
//   ?session_id=<stripe>  → returning from Stripe Checkout success_url; we
//                           look up the resume_token from clients server-side
//                           and pass it down. May briefly show a "your setup
//                           is finalizing" screen if the Stripe webhook
//                           hasn't fired yet.

import OnboardingChatClient from './OnboardingChatClient';
import { createServiceClient } from '@/lib/db/supabase-service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Welcome to GoElev8.ai — Onboarding',
  description: 'Finish setting up your AI agents and client portal.',
};

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string; session_id?: string };
}) {
  const slug = params.slug;
  const directToken = searchParams.token ?? '';
  const sessionId = searchParams.session_id ?? '';

  let token = directToken;

  if (!token && sessionId) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('clients')
        .select('resume_token, onboarding_config_slug')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();
      if (data?.resume_token && data?.onboarding_config_slug === slug) {
        token = data.resume_token;
      }
    } catch (err: any) {
      console.error('[onboarding/page] session_id lookup failed:', err?.message ?? err);
    }
  }

  if (!token && sessionId) {
    // Webhook hasn't landed yet. Render a transient "finalizing" screen and
    // auto-refresh — the client row should exist within a couple seconds.
    return <FinalizingScreen slug={slug} sessionId={sessionId} />;
  }

  return <OnboardingChatClient slug={slug} token={token} />;
}

function FinalizingScreen({ slug, sessionId }: { slug: string; sessionId: string }) {
  const refreshUrl = `/onboarding/${encodeURIComponent(slug)}?session_id=${encodeURIComponent(sessionId)}`;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content={`3;url=${refreshUrl}`} />
        <title>Finalizing your setup… — GoElev8.ai</title>
      </head>
      <body style={{ margin: 0, background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 460, textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#F5B800', margin: '0 0 12px', fontWeight: 600 }}>
              Payment confirmed
            </p>
            <h1 style={{ margin: '0 0 14px', fontSize: 28, fontWeight: 300 }}>Finalizing your setup…</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6 }}>
              Hang tight for a few seconds — we&apos;re wiring up your account. This page will refresh automatically.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
