// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Post-checkout thank-you page for the /mcclain/demo flow. Reads the
// Stripe Checkout Session server-side (rather than trusting the redirect
// alone) so we don't celebrate a payment that didn't actually clear.

import Stripe from 'stripe';
import { getMcclainTier } from '@/lib/mcclain-tiers';
import '../demo.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "You're in — McClain Law × GoElev8.ai",
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id ?? '';
  let result:
    | { ok: true; tierName: string; monthlyDollars: string; setupDollars: string; email: string | null; name: string | null }
    | { ok: false; error: string }
    | null = null;

  if (!sessionId) {
    result = { ok: false, error: 'Missing session reference.' };
  } else {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      result = { ok: false, error: 'Stripe not configured.' };
    } else {
      try {
        const stripe = new Stripe(key);
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['customer_details'],
        });
        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          result = { ok: false, error: 'Payment not yet confirmed. Refresh in a few seconds.' };
        } else {
          const tierKey = session.metadata?.tier ?? '';
          const tier = getMcclainTier(tierKey);
          const tierName = session.metadata?.tier_name ?? tier?.name ?? '(unknown tier)';
          const monthlyCents = Number(session.metadata?.monthly_cents ?? tier?.monthlyCents ?? 0);
          const setupCents = Number(session.metadata?.setup_cents ?? tier?.setupCents ?? 0);
          result = {
            ok: true,
            tierName,
            monthlyDollars: (monthlyCents / 100).toFixed(0),
            setupDollars: (setupCents / 100).toFixed(0),
            email: session.customer_details?.email ?? null,
            name: session.customer_details?.name ?? null,
          };
        }
      } catch (err: any) {
        console.error('[mcclain/thank-you]', err?.message ?? err);
        result = { ok: false, error: 'Could not look up your receipt.' };
      }
    }
  }

  return (
    <div className="mcclain-demo">
      <div className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="wrap" style={{ maxWidth: 640, textAlign: 'center' }}>
          {result?.ok ? (
            <>
              <div className="eyebrow mono" style={{ justifyContent: 'center' }}>
                Payment confirmed
              </div>
              <h1 style={{ maxWidth: 'none' }}>
                You&apos;re in{result.name ? `, ${result.name.split(' ')[0]}` : ''}.
              </h1>
              <p className="sub" style={{ margin: '22px auto 32px', textAlign: 'center' }}>
                Aaron will reach out within <strong style={{ color: 'var(--white)' }}>1 business day</strong> to schedule the kick-off for your <strong style={{ color: 'var(--white)' }}>{result.tierName}</strong> tier. Your intake agent goes live within 5–7 business days.
              </p>

              <div
                style={{
                  background: 'rgba(228,199,102,0.08)',
                  border: '1px solid rgba(228,199,102,0.3)',
                  padding: '22px 24px',
                  textAlign: 'left',
                  maxWidth: 460,
                  margin: '0 auto 30px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(251,250,247,0.75)' }}>
                  <span>Tier</span>
                  <span style={{ color: 'var(--white)' }}>{result.tierName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(251,250,247,0.75)' }}>
                  <span>Setup (one-time)</span>
                  <span style={{ color: 'var(--white)' }}>${result.setupDollars}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(251,250,247,0.75)' }}>
                  <span>Monthly</span>
                  <span style={{ color: 'var(--white)' }}>${result.monthlyDollars}/mo</span>
                </div>
                {result.email ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(251,250,247,0.75)' }}>
                    <span>Receipt to</span>
                    <span style={{ color: 'var(--white)' }}>{result.email}</span>
                  </div>
                ) : null}
              </div>

              <p style={{ color: 'rgba(251,250,247,0.55)', fontSize: 13 }}>
                Questions?{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: 'var(--brass-light)', textDecoration: 'none' }}>
                  ab@goelev8.ai
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="eyebrow mono" style={{ justifyContent: 'center' }}>
                One moment
              </div>
              <h1 style={{ maxWidth: 'none' }}>Finalizing your receipt</h1>
              <p className="sub" style={{ margin: '22px auto 0', textAlign: 'center' }}>
                {result?.error ?? 'Loading…'} If this persists, email{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: 'var(--brass-light)', textDecoration: 'none' }}>
                  ab@goelev8.ai
                </a>{' '}
                with the URL of this page.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
