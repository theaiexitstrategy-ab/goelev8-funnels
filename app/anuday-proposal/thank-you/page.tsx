// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Post-checkout confirmation for the /anuday-proposal Stripe flow. Reads
// the session server-side and refuses to celebrate unless payment_status
// is 'paid' (or session.status is 'complete' for subscription checkouts).

import Stripe from 'stripe';
import '../proposal.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "You're in — GoElev8.ai proposal",
  robots: { index: false, follow: false },
};

export default async function ProposalThankYouPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id ?? '';
  let result:
    | { ok: true; business: string; plan: string; amountDollars: string; recurring: boolean; email: string | null; name: string | null }
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
        const paid = session.payment_status === 'paid' || session.status === 'complete';
        if (!paid) {
          result = { ok: false, error: 'Payment not yet confirmed. Refresh in a few seconds.' };
        } else {
          const amountTotal = session.amount_total ?? 0;
          const md = session.metadata ?? {};
          result = {
            ok: true,
            business: md.business ?? 'Your business',
            plan: md.plan ?? '',
            amountDollars: (amountTotal / 100).toFixed(2),
            recurring: (md.plan ?? '').endsWith('-monthly'),
            email: session.customer_details?.email ?? null,
            name: session.customer_details?.name ?? null,
          };
        }
      } catch (err: any) {
        console.error('[anuday-proposal/thank-you]', err?.message ?? err);
        result = { ok: false, error: 'Could not look up your receipt.' };
      }
    }
  }

  return (
    <div className="proposal">
      <header className="top">
        <div className="brand">
          GO<strong>ELEV8</strong>.AI
        </div>
        <div className="meta">
          <span>Confirmation</span>
        </div>
      </header>

      <div className="page">
        <div className="hero" style={{ marginBottom: 0 }}>
          {result?.ok ? (
            <>
              <div className="eyebrow">Payment confirmed</div>
              <h1>
                Thank you{result.name ? `, ${result.name.split(' ')[0]}` : ''}. <em>Received.</em>
              </h1>
              <p className="lede">
                Your <strong>{result.business}</strong> {result.recurring ? 'monthly subscription' : 'setup fee'} of{' '}
                <strong>${result.amountDollars}</strong> is confirmed. I&apos;ll email you within one business day
                to schedule the 30-minute kickoff{result.recurring ? '' : ' and get the build started'}.
                Your new site will be live within 5&ndash;7 business days from that call.
              </p>
              <dl className="prepared">
                <div>
                  <dt>Business</dt>
                  <dd>{result.business}</dd>
                </div>
                <div>
                  <dt>Charged today</dt>
                  <dd>${result.amountDollars}{result.recurring ? ' / mo' : ' one-time'}</dd>
                </div>
                {result.email ? (
                  <div>
                    <dt>Receipt to</dt>
                    <dd>{result.email}</dd>
                  </div>
                ) : null}
              </dl>
              <p style={{ marginTop: '24px', color: 'var(--slate)' }}>
                Questions before we kick off?{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: 'var(--amber-dark)', textDecoration: 'underline', textDecorationColor: 'var(--rule)' }}>
                  ab@goelev8.ai
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="eyebrow">One moment</div>
              <h1>Finalizing your receipt.</h1>
              <p className="lede">
                {result?.error ?? 'Loading…'} If this persists, email{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: 'var(--amber-dark)' }}>
                  ab@goelev8.ai
                </a>{' '}
                with the URL of this page.
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="foot">
        Prepared by Aaron Bryant &nbsp;·&nbsp; <a href="https://goelev8.ai">goelev8.ai</a>
      </footer>
    </div>
  );
}
