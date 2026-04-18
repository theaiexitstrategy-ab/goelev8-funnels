// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

export default function PoweredByPage() {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    window.location.href = `/auth/signup?prompt=${encodeURIComponent(prompt)}`;
  };

  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{ display: 'block' }} /></a>
        <a href="/auth/signup" style={{ background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1 }}>Start Free Trial</a>
      </nav>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', textAlign: 'center', letterSpacing: 2, lineHeight: 1.1, marginBottom: 20 }}>
          YOU JUST EXPERIENCED THE GOELEV8.AI LEAD ACQUISITION SYSTEM.
        </h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          The page you just visited captures leads, sends automatic follow-ups,
          and calls prospects back in 5 minutes — all without human involvement.
          You can have this for your business. In one prompt. Free for 7 days.
        </p>

        {/* What just happened */}
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28, marginBottom: 48 }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color: '#fff', letterSpacing: 1, marginBottom: 20 }}>WHAT JUST HAPPENED</h2>
          {[
            'You visited a business page built in one prompt',
            'The system was ready to capture your info and follow up',
            'If you opted in: you got an SMS within 60 seconds',
            'On Grow plan: you would have gotten a call within 5 minutes',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#00CFFF', fontSize: 14, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ color: '#AAA', fontSize: 14, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Prompt Box */}
        <form onSubmit={handleSubmit} style={{
          background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, marginBottom: 48,
        }}>
          <label style={{ display: 'block', fontSize: 14, color: '#888', marginBottom: 12 }}>
            Describe your business to build yours:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="I run a barbershop in Brooklyn specializing in fades and hot towel shaves..."
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: '1px solid #333', borderRadius: 8,
              color: '#00CFFF', fontSize: 15, fontFamily: '"JetBrains Mono", monospace',
              padding: 12, resize: 'none', outline: 'none',
            }}
          />
          <button type="submit" style={{
            marginTop: 16, background: '#00CFFF', color: '#000', border: 'none',
            padding: '14px 32px', borderRadius: 8, fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 18, letterSpacing: 1, cursor: 'pointer', width: '100%',
          }}>
            BUILD MINE FREE &rarr;
          </button>
        </form>

        {/* Condensed Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 48 }}>
          {[
            { name: 'Launch', price: '$99/mo' },
            { name: 'Grow', price: '$199/mo' },
            { name: 'Scale', price: '$397/mo' },
          ].map((plan) => (
            <div key={plan.name} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{plan.name}</h3>
              <span style={{ color: '#00CFFF', fontSize: 18, fontWeight: 700 }}>{plan.price}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontSize: 14 }}>
          7-day free trial. Card on file. Not charged until Day 8.
        </p>
      </main>

      <footer style={{ maxWidth: 1200, margin: '60px auto 0', padding: '32px 24px', borderTop: '1px solid #1A1A1A', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 12, color: '#333' }}>&copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.</p>
      </footer>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`}</style>
    </div>
  );
}
