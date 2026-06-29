// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Post-checkout landing for the ROQ Body × GoElev8.ai setup. Full
// onboarding agent for ROQ Body lands in a follow-up; for now this is
// the receipt + "Aaron will reach out" page so the success_url isn't
// 404'ing.

export const metadata = {
  title: "You're In — ROQ Body × GoElev8.ai",
};

export default function RoqBodyOnboardingPage() {
  const GOLD = '#F5B800';
  return (
    <div
      style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
        }}
      >
        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 18 }}>🎉</div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: GOLD,
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            Payment confirmed
          </p>
          <h1
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(40px, 7vw, 64px)',
              letterSpacing: 1.5,
              lineHeight: 1,
              margin: '0 0 18px',
              fontWeight: 400,
            }}
          >
            You&apos;re in, Quantarrius.
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 17,
              lineHeight: 1.6,
              margin: '0 auto 32px',
              maxWidth: 520,
            }}
          >
            Your ROQ Body setup is locked in. Aaron will reach out within{' '}
            <strong style={{ color: '#fff' }}>1 business day</strong> to kick off
            onboarding — brand details, site walkthrough, and the agent build.
            Your AI will be live within <strong style={{ color: '#fff' }}>5–7 business days</strong>.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Questions in the meantime?{' '}
            <a
              href="mailto:ab@goelev8.ai"
              style={{ color: GOLD, textDecoration: 'none' }}
            >
              ab@goelev8.ai
            </a>
          </p>
        </div>
      </main>
      <footer
        style={{
          padding: '30px 24px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        © 2026 GoElev8.ai | Aaron Bryant ·{' '}
        <a href="https://goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>
          goelev8.ai
        </a>
      </footer>
    </div>
  );
}
