// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

export default function RiyanBRecruitingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'recruiting-riyanb' }),
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8.ai_logo.png" alt="GoElev8.ai" width={36} height={36} style={{ display: 'block' }} /></a>
        <span style={{ fontSize: 12, color: '#555', fontFamily: '"JetBrains Mono", monospace' }}>/ Recruiting</span>
      </nav>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(48px, 8vw, 80px)', color: '#fff', letterSpacing: 4, lineHeight: 1, marginBottom: 12 }}>
          RIYAN BRYANT
        </h1>
        <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: '#00CFFF', letterSpacing: 3, marginBottom: 48 }}>
          NCAA D1 DANCE RECRUITING &middot; CLASS OF 2027
        </p>

        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, marginBottom: 40 }}>
          <p style={{ color: '#888', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
            Athlete recruiting profiles are coming to GoElev8.ai.<br />
            Built on the same AI platform powering service businesses nationwide.<br />
            Join the waitlist to get early access.
          </p>

          {submitted ? (
            <div style={{ background: 'rgba(0,207,255,0.1)', border: '1px solid #00CFFF', borderRadius: 8, padding: 20 }}>
              <p style={{ color: '#00CFFF', fontSize: 15, margin: 0 }}>
                You&apos;re on the list. We&apos;ll notify you when recruiting profiles launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email" required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: '1 1 250px', background: 'transparent', border: '1px solid #333',
                  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none',
                }}
              />
              <button type="submit" style={{
                background: '#00CFFF', color: '#000', border: 'none', padding: '12px 28px',
                borderRadius: 8, fontFamily: '"Bebas Neue", sans-serif', fontSize: 16,
                letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                JOIN WAITLIST
              </button>
            </form>
          )}
        </div>

        <a href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>
          <span style={{ color: '#00CFFF' }}>Powered by GoElev8.ai</span> &middot; goelev8.ai
        </a>
      </main>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`}</style>
    </div>
  );
}
