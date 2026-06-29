// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Post-checkout success page for SMS credit pack purchases. Lives at
// /smscalc/success?session_id=<stripe>. Looks up the session server-side
// to confirm the buyer actually paid (instead of trusting the redirect
// alone) and renders a quick receipt + next-steps blurb.

import Stripe from 'stripe';
import { getPack, totalCreditsForPack } from '@/lib/sms-packs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Credits Confirmed — GoElev8.ai',
};

const GOLD = '#F5B800';
const BG = '#0A0A0A';

export default async function SmsCalcSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id ?? '';
  let result: { ok: true; pack: ReturnType<typeof getPack>; totalCredits: number; email: string | null }
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
        const packId = (session.metadata?.pack_id ?? '') as string;
        const pack = getPack(packId);
        if (!pack) {
          result = { ok: false, error: 'Pack not recognized.' };
        } else if (session.payment_status !== 'paid') {
          result = { ok: false, error: 'Payment not yet confirmed. Refresh in a few seconds.' };
        } else {
          result = {
            ok: true,
            pack,
            totalCredits: totalCreditsForPack(pack),
            email: session.customer_details?.email ?? null,
          };
        }
      } catch (err: any) {
        console.error('[smscalc/success]', err?.message ?? err);
        result = { ok: false, error: 'Could not look up your receipt.' };
      }
    }
  }

  return (
    <div style={{
      background: BG, color: '#fff', minHeight: '100vh',
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px',
      }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          {result?.ok ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 18, textAlign: 'center' }}>🎉</div>
              <p style={{
                textAlign: 'center', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                color: GOLD, margin: '0 0 12px', fontWeight: 600,
              }}>
                Payment Confirmed
              </p>
              <h1 style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(36px, 6vw, 56px)', letterSpacing: 1.5,
                lineHeight: 1, margin: '0 0 18px', fontWeight: 400, textAlign: 'center',
              }}>
                {result.pack!.name} Pack — {result.totalCredits.toLocaleString()} credits
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.6,
                margin: '0 auto 28px', maxWidth: 480, textAlign: 'center',
              }}>
                Your <strong style={{ color: '#fff' }}>{result.totalCredits.toLocaleString()}</strong> credits will be applied to your GoElev8.ai account within{' '}
                <strong style={{ color: '#fff' }}>1 business day</strong>. Existing clients who entered their slug get auto-credited immediately.
              </p>
              <div style={{
                background: '#0a0a0a', border: '1px solid rgba(245,184,0,0.18)',
                borderRadius: 8, padding: '18px 20px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                  Receipt
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Pack</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{result.pack!.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Credits</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{result.totalCredits.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Paid</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    ${(result.pack!.priceCents / 100).toFixed(0)}
                  </span>
                </div>
                {result.email ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
                    <span style={{ color: 'rgba(255,255,255,0.65)' }}>Confirmation sent to</span>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{result.email}</span>
                  </div>
                ) : null}
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Questions?{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>
                  ab@goelev8.ai
                </a>
                {' '}· Back to{' '}
                <a href="/smscalc" style={{ color: GOLD, textDecoration: 'none' }}>
                  SMS calculator
                </a>
              </p>
            </>
          ) : (
            <>
              <p style={{
                textAlign: 'center', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                color: GOLD, margin: '0 0 12px', fontWeight: 600,
              }}>
                One moment
              </p>
              <h1 style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: 1.5,
                margin: '0 0 14px', fontWeight: 400, textAlign: 'center',
              }}>
                Finalizing your receipt
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6,
                margin: '0 auto', maxWidth: 460, textAlign: 'center',
              }}>
                {result?.error ?? 'Loading…'} If this persists, email{' '}
                <a href="mailto:ab@goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>
                  ab@goelev8.ai
                </a>
                {' '}with the URL of this page and we&apos;ll sort it out.
              </p>
            </>
          )}
        </div>
      </main>
      <footer style={{
        padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)',
        fontSize: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        © 2026 GoElev8.ai · Aaron Bryant
      </footer>
    </div>
  );
}
