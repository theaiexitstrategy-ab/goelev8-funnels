// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to GoElev8.ai',
  description: 'Your Founding Client onboarding has started.',
};

export default function SuccessPage() {
  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}>
          <img src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{ display: 'block' }} />
        </a>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, lineHeight: 1 }}>✅</div>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 48, color: '#00CFFF', letterSpacing: 2, marginBottom: 16 }}>
          You&apos;re in.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 40 }}>
          Payment received. Welcome to GoElev8.ai as a Founding Client.
        </p>

        <div style={{ background: 'rgba(0,207,255,.07)', border: '1px solid rgba(0,207,255,.2)', borderRadius: 6, padding: '28px 24px', textAlign: 'left', marginBottom: 32 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: '#00CFFF', letterSpacing: 1.5, marginBottom: 14 }}>What happens next</h2>
          <ol style={{ paddingLeft: 22, lineHeight: 1.75, fontSize: 15, margin: 0 }}>
            <li>You&apos;ll get an onboarding email from <strong>aaron@goelev8.ai</strong> within the next few hours with your kickoff link.</li>
            <li>Aaron will reach out personally within 24 hours to schedule your setup call.</li>
            <li>Your system goes live in 48 hours from your kickoff call.</li>
          </ol>
        </div>

        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          Questions? Reply to your receipt email or text the GoElev8.ai line.
        </p>

        <a href="/" style={{ display: 'inline-block', background: '#00CFFF', color: '#000', padding: '12px 28px', textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1.5, borderRadius: 2 }}>
          Back to Home
        </a>
      </main>
    </div>
  );
}
