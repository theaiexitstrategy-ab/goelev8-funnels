// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

const PLANS = [
  {
    name: 'Launch', monthly: 99, annual: 79, popular: false,
    features: [
      '1 AI business page',
      '250 leads/mo',
      '5-step SMS nudge sequence',
      'Chat widget',
      'Product store',
      'No AI phone agent',
    ],
  },
  {
    name: 'Grow', monthly: 199, annual: 159, popular: true,
    features: [
      '3 AI business pages',
      '1,000 leads/mo',
      'Everything in Launch',
      'AI phone agent (calls leads in 5 min)',
      'SMS blast campaigns',
      'Live demo from prompt box',
      'Client CRM portal',
      'Booking calendar',
    ],
  },
  {
    name: 'Scale', monthly: 397, annual: 317, popular: false,
    features: [
      'Unlimited pages & leads',
      'Everything in Grow',
      'White-label option',
      '1 custom domain included',
      'Agency-ready (multi-client)',
      '8% product store cut (vs 10%)',
    ],
  },
];

const SMS_PACKS = [
  { name: 'Starter', price: 25, messages: 250, perMsg: '0.10' },
  { name: 'Active', price: 50, messages: 625, perMsg: '0.08' },
  { name: 'Blaster', price: 100, messages: 2000, perMsg: '0.05' },
];

const FAQS = [
  { q: 'Is my card charged immediately?', a: 'No. Your 7-day trial starts immediately. You are not charged until Day 8.' },
  { q: 'Can I cancel before Day 8?', a: 'Yes. Cancel anytime during trial. Zero charge.' },
  { q: 'What happens when leads reply to SMS?', a: 'Replies are routed to your CRM inbox and trigger an auto-reply from your AI agent.' },
  { q: 'Do I need technical skills?', a: 'No. Type one prompt describing your business. The system builds everything.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      {/* Scanline */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8.ai_logo.png" alt="GoElev8.ai" width={36} height={36} style={{ display: 'block' }} /></a>
        <a href="/auth/signup" style={{ background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1 }}>Start Free Trial</a>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 48, color: '#fff', textAlign: 'center', letterSpacing: 3, marginBottom: 12 }}>PRICING</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 32 }}>7-day free trial on all plans. Cancel anytime.</p>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <button onClick={() => setAnnual(false)} style={{ background: !annual ? '#00CFFF' : 'transparent', color: !annual ? '#000' : '#888', border: '1px solid #333', padding: '8px 20px', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontSize: 14 }}>Monthly</button>
          <button onClick={() => setAnnual(true)} style={{ background: annual ? '#00CFFF' : 'transparent', color: annual ? '#000' : '#888', border: '1px solid #333', padding: '8px 20px', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 14 }}>Annual (Save 20%)</button>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 80 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{ background: '#0A0A0A', border: plan.popular ? '2px solid #00CFFF' : '1px solid #1A1A1A', borderRadius: 16, padding: 32, position: 'relative' }}>
              {plan.popular && (
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00CFFF', color: '#000', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>MOST POPULAR</span>
              )}
              <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>{plan.name}</h2>
              <div style={{ fontSize: 42, fontWeight: 700, color: '#00CFFF', marginBottom: 4 }}>
                ${annual ? plan.annual : plan.monthly}<span style={{ fontSize: 16, color: '#888', fontWeight: 300 }}>/mo</span>
              </div>
              {annual && <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>billed annually (${plan.annual * 12}/yr)</p>}
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: '#AAA', marginBottom: 10, paddingLeft: 20, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#00CFFF' }}>+</span>{f}
                  </li>
                ))}
              </ul>
              <a href="/auth/signup" style={{ display: 'block', textAlign: 'center', background: plan.popular ? '#00CFFF' : 'transparent', color: plan.popular ? '#000' : '#00CFFF', border: '1px solid #00CFFF', padding: '12px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
                Start Free Trial
              </a>
            </div>
          ))}
        </div>

        {/* SMS Credits */}
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: '#fff', textAlign: 'center', letterSpacing: 2, marginBottom: 12 }}>SMS CREDITS</h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 32 }}>Credits never expire. No monthly SMS fee.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 80 }}>
          {SMS_PACKS.map((pack) => (
            <div key={pack.name} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, color: '#fff', letterSpacing: 1 }}>{pack.name}</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00CFFF', margin: '8px 0' }}>${pack.price}</div>
              <p style={{ color: '#888', fontSize: 14 }}>{pack.messages.toLocaleString()} messages</p>
              <p style={{ color: '#555', fontSize: 13 }}>${pack.perMsg}/msg</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: '#fff', textAlign: 'center', letterSpacing: 2, marginBottom: 32 }}>FAQ</h2>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #1A1A1A', marginBottom: 0 }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 16, padding: '20px 0', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {faq.q}
                <span style={{ color: '#00CFFF', fontSize: 20 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, padding: '0 0 20px', margin: 0 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: 1200, margin: '60px auto 0', padding: '32px 24px', borderTop: '1px solid #1A1A1A', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 12, color: '#333' }}>&copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.</p>
      </footer>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  );
}
