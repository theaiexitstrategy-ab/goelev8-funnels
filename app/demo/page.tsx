// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');

  const startBrowserCall = async () => {
    setCallStatus('connecting');
    try {
      // Load Vapi SDK dynamically from CDN to avoid build dependency
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web/dist/vapi.min.js';
      script.onload = () => {
        const VapiSDK = (window as any).Vapi;
        if (!VapiSDK) { setCallStatus('idle'); return; }
        const vapi = new VapiSDK(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
        vapi.on('call-start', () => setCallStatus('connected'));
        vapi.on('call-end', () => setCallStatus('ended'));
        vapi.start(process.env.NEXT_PUBLIC_VAPI_DEMO_ASSISTANT_ID!);
      };
      script.onerror = () => setCallStatus('idle');
      document.head.appendChild(script);
    } catch {
      setCallStatus('idle');
    }
  };

  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8.ai_logo.png" alt="GoElev8.ai" width={36} height={36} style={{ display: 'block' }} /></a>
        <a href="/auth/signup" style={{ background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1 }}>Start Free Trial</a>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 10 }}>
        {/* Live Voice Demo */}
        <section style={{ textAlign: 'center', marginBottom: 80 }}>
          <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 48, color: '#fff', letterSpacing: 3, marginBottom: 12 }}>LIVE DEMO</h1>
          <p style={{ color: '#888', fontSize: 16, marginBottom: 40 }}>Talk to the AI agent right now — in your browser.</p>

          <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 16, padding: 40, maxWidth: 500, margin: '0 auto' }}>
            {callStatus === 'idle' && (
              <button onClick={startBrowserCall} style={{
                background: '#00CFFF', color: '#000', border: 'none', padding: '16px 40px',
                borderRadius: 50, fontFamily: '"Bebas Neue", sans-serif', fontSize: 22,
                letterSpacing: 2, cursor: 'pointer', width: '100%',
              }}>
                START VOICE DEMO
              </button>
            )}
            {callStatus === 'connecting' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '3px solid #1A1A1A', borderTopColor: '#00CFFF', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#00CFFF', fontFamily: '"JetBrains Mono", monospace', fontSize: 14 }}>CONNECTING...</p>
              </div>
            )}
            {callStatus === 'connected' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#00CFFF', margin: '0 auto 16px', animation: 'pulse 2s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  📞
                </div>
                <p style={{ color: '#00CFFF', fontFamily: '"JetBrains Mono", monospace', fontSize: 14 }}>CONNECTED — SPEAK NOW</p>
              </div>
            )}
            {callStatus === 'ended' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#28C840', fontSize: 16, marginBottom: 16 }}>Call ended. How was that?</p>
                <button onClick={() => setCallStatus('idle')} style={{
                  background: 'transparent', color: '#00CFFF', border: '1px solid #00CFFF',
                  padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                }}>
                  Try Again
                </button>
              </div>
            )}

            <div style={{ marginTop: 24, borderTop: '1px solid #1A1A1A', paddingTop: 16 }}>
              <p style={{ color: '#555', fontSize: 13, marginBottom: 8 }}>Or call directly:</p>
              <a href="tel:888-302-0649" style={{ color: '#00CFFF', fontSize: 20, fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none', letterSpacing: 2 }}>
                888-302-0649
              </a>
            </div>
          </div>
        </section>

        {/* Live Page Preview */}
        <section style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: '#fff', letterSpacing: 2, marginBottom: 12 }}>
            SEE A REAL AI BUSINESS PAGE
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>
            Fill out the form. You&apos;ll get an SMS within 60 seconds.<br />
            If the business is on Grow plan: you&apos;ll get a call within 5 minutes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { slug: 'the-flex-facility', name: 'The Flex Facility', type: 'Fitness Studio' },
              { slug: 'islay-studios', name: 'iSlay Studios', type: 'Recording Studio' },
            ].map((demo) => (
              <a key={demo.slug} href={`/f/${demo.slug}`} style={{
                background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12,
                padding: 24, textDecoration: 'none', display: 'block', textAlign: 'center',
                transition: 'border-color 0.2s',
              }}>
                <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: 4 }}>{demo.name}</h3>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>{demo.type}</p>
                <span style={{ color: '#00CFFF', fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }}>
                  /f/{demo.slug} &rarr;
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ maxWidth: 1200, margin: '80px auto 0', padding: '32px 24px', borderTop: '1px solid #1A1A1A', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 12, color: '#333' }}>&copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
      `}</style>
    </div>
  );
}
