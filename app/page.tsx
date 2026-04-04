// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState, useEffect, useRef } from 'react';

const PLACEHOLDERS = [
  'I run a hair salon in Atlanta specializing in natural hair...',
  'Personal trainer in Chicago, free assessment for new clients...',
  'Recording studio in St. Louis, free 1-hour intro session...',
  'Mobile detailing business in Houston, first wash 50% off...',
  'Med spa in Miami offering free consultations...',
];

const BUILD_STEPS = [
  'Analyzing your business...',
  'Building funnel page...',
  'Generating SMS sequence...',
  'Creating AI agent...',
];

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(-1);
  const [buildDone, setBuildDone] = useState(false);
  const [annualPricing, setAnnualPricing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleBuild = () => {
    if (!prompt.trim()) return;
    setBuilding(true);
    setBuildStep(0);
    BUILD_STEPS.forEach((_, i) => {
      setTimeout(() => setBuildStep(i), (i + 1) * 1200);
    });
    setTimeout(() => {
      setBuildDone(true);
      setBuilding(false);
    }, BUILD_STEPS.length * 1200 + 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBuild();
    }
  };

  return (
    <div style={{
      background: '#000', color: '#E0E0E0', minHeight: '100vh',
      fontFamily: '"DM Sans", -apple-system, sans-serif', fontWeight: 300,
      cursor: 'crosshair', position: 'relative', overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)',
      }} />

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10,
      }}>
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#00CFFF', letterSpacing: 2 }}>
          GoElev8.ai
        </span>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: 14 }}>
          <a href="/pricing" style={{ color: '#999', textDecoration: 'none' }}>Pricing</a>
          <a href="/demo" style={{ color: '#999', textDecoration: 'none' }}>Demo</a>
          <a href="/templates" style={{ color: '#999', textDecoration: 'none' }}>Templates</a>
          <a href="/auth/signup" style={{
            background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6,
            textDecoration: 'none', fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1,
          }}>
            Start Free Trial
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        maxWidth: 1000, margin: '60px auto 0', padding: '0 24px', textAlign: 'center',
        position: 'relative', zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(36px, 6vw, 72px)',
          color: '#fff', letterSpacing: 3, lineHeight: 1.1, marginBottom: 16,
          animation: 'glitch 3s infinite',
        }}>
          BUILD YOUR AI BUSINESS PAGE BY PROMPT.
        </h1>
        <p style={{ fontSize: 18, color: '#888', marginBottom: 48 }}>
          The only page that calls your leads back. Free for 7 days.
        </p>

        {/* PROMPT BOX */}
        <div style={{
          background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12,
          padding: 24, maxWidth: 680, margin: '0 auto', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <span style={{ marginLeft: 12, fontSize: 11, color: '#444', fontFamily: '"JetBrains Mono", monospace' }}>
              goelev8.ai/build
            </span>
          </div>

          {!building && !buildDone ? (
            <>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                rows={3}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: '#00CFFF', fontSize: 16, fontFamily: '"JetBrains Mono", monospace',
                  resize: 'none', caretColor: '#00CFFF',
                }}
              />
              <button
                onClick={handleBuild}
                style={{
                  marginTop: 16, background: '#00CFFF', color: '#000', border: 'none',
                  padding: '12px 32px', borderRadius: 8, fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 18, letterSpacing: 1, cursor: 'pointer', width: '100%',
                }}
              >
                Start Free Trial &rarr;
              </button>
            </>
          ) : building ? (
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14 }}>
              {BUILD_STEPS.map((step, i) => (
                <div key={i} style={{
                  color: i <= buildStep ? '#00CFFF' : '#333',
                  marginBottom: 8,
                  transition: 'color 0.3s',
                }}>
                  [{i + 1}] {step} {i < buildStep ? '✓' : i === buildStep ? '...' : ''}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14 }}>
              {BUILD_STEPS.map((step, i) => (
                <div key={i} style={{ color: '#00CFFF', marginBottom: 8 }}>
                  [{i + 1}] {step} ✓
                </div>
              ))}
              <div style={{ color: '#28C840', marginTop: 12, fontWeight: 600 }}>
                [5] ✓ Your page is live at goelev8.ai/f/your-slug
              </div>
              <a href="/auth/signup" style={{
                display: 'block', marginTop: 16, background: '#00CFFF', color: '#000',
                border: 'none', padding: '12px 32px', borderRadius: 8,
                fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, letterSpacing: 1,
                textAlign: 'center', textDecoration: 'none',
              }}>
                Claim Your Page &rarr;
              </a>
            </div>
          )}

          <p style={{ fontSize: 12, color: '#555', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
            7 days free. Card on file. Not charged until Day 8.
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section style={{
        maxWidth: 800, margin: '80px auto 0', padding: '0 24px', textAlign: 'center',
        position: 'relative', zIndex: 10,
      }}>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
          Live examples built on GoElev8.ai
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          <a href="/f/the-flex-facility" style={{ color: '#00CFFF', fontSize: 14, textDecoration: 'none', fontFamily: '"JetBrains Mono", monospace' }}>
            /f/the-flex-facility
          </a>
          <a href="/f/islay-studios" style={{ color: '#00CFFF', fontSize: 14, textDecoration: 'none', fontFamily: '"JetBrains Mono", monospace' }}>
            /f/islay-studios
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{
        maxWidth: 900, margin: '100px auto 0', padding: '0 24px',
        position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: '#fff', textAlign: 'center', letterSpacing: 2, marginBottom: 48 }}>
          HOW IT WORKS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
          {[
            { num: '01', title: 'Describe your business', desc: 'Type one prompt. That\'s it.' },
            { num: '02', title: 'System builds everything', desc: 'Your page, SMS sequence, and AI phone agent — generated in seconds.' },
            { num: '03', title: 'Leads come in automatically', desc: 'Leads opt in. System calls them in 5 minutes. Books automatically.' },
          ].map((step) => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 56, color: '#00CFFF', opacity: 0.3 }}>
                {step.num}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{step.title}</h3>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section style={{
        maxWidth: 900, margin: '100px auto 0', padding: '0 24px',
        position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: '#fff', textAlign: 'center', letterSpacing: 2, marginBottom: 48 }}>
          WHAT YOU GET
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: '📄', title: 'AI Business Page', desc: 'Custom landing page built from your prompt' },
            { icon: '💬', title: '5-Step SMS Nudge', desc: 'Automated follow-up that converts leads' },
            { icon: '📞', title: 'AI Phone Agent', desc: 'Calls your leads within 5 minutes' },
            { icon: '📅', title: 'Booking Calendar', desc: 'Google Calendar integration, auto-schedule' },
            { icon: '🛒', title: 'Product Store', desc: 'Sell products directly from your page' },
            { icon: '🌐', title: 'Works on Any Website', desc: 'Embed on Shopify, WordPress, Wix, more' },
          ].map((f) => (
            <div key={f.title} style={{
              background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 10, padding: 20,
            }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginTop: 12, marginBottom: 4 }}>{f.title}</h3>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={{
        maxWidth: 1000, margin: '100px auto 0', padding: '0 24px',
        position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: '#fff', textAlign: 'center', letterSpacing: 2, marginBottom: 16 }}>
          PRICING
        </h2>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            onClick={() => setAnnualPricing(false)}
            style={{ background: !annualPricing ? '#00CFFF' : 'transparent', color: !annualPricing ? '#000' : '#888', border: '1px solid #333', padding: '6px 16px', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontSize: 13 }}
          >Monthly</button>
          <button
            onClick={() => setAnnualPricing(true)}
            style={{ background: annualPricing ? '#00CFFF' : 'transparent', color: annualPricing ? '#000' : '#888', border: '1px solid #333', padding: '6px 16px', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 13 }}
          >Annual (Save 20%)</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { name: 'Launch', monthly: 99, annual: 79, popular: false },
            { name: 'Grow', monthly: 199, annual: 159, popular: true },
            { name: 'Scale', monthly: 397, annual: 317, popular: false },
          ].map((plan) => (
            <div key={plan.name} style={{
              background: '#0A0A0A', border: plan.popular ? '2px solid #00CFFF' : '1px solid #1A1A1A',
              borderRadius: 12, padding: 24, textAlign: 'center', position: 'relative',
            }}>
              {plan.popular && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#00CFFF', color: '#000', padding: '2px 12px', borderRadius: 12,
                  fontSize: 11, fontWeight: 700, letterSpacing: 1,
                }}>MOST POPULAR</span>
              )}
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#fff', letterSpacing: 2 }}>{plan.name}</h3>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#00CFFF', marginBottom: 4 }}>
                ${annualPricing ? plan.annual : plan.monthly}
                <span style={{ fontSize: 14, color: '#888', fontWeight: 300 }}>/mo</span>
              </div>
              {annualPricing && (
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 12px' }}>
                  billed annually (${plan.annual * 12}/yr)
                </p>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/pricing" style={{ color: '#00CFFF', fontSize: 14, textDecoration: 'none' }}>
            View full pricing &rarr;
          </a>
        </div>
      </section>

      {/* DEMO CALLOUT */}
      <section style={{
        maxWidth: 700, margin: '100px auto 0', padding: '40px 24px',
        textAlign: 'center', position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 36, color: '#fff', letterSpacing: 2, marginBottom: 12 }}>
          HEAR IT LIVE
        </h2>
        <p style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>
          Call the AI agent right now and hear it work.
        </p>
        <a href="tel:888-302-0649" style={{
          display: 'inline-block', background: '#0A0A0A', border: '1px solid #00CFFF',
          color: '#00CFFF', padding: '14px 32px', borderRadius: 8, fontSize: 22,
          fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none', letterSpacing: 2,
        }}>
          888-302-0649
        </a>
        <p style={{ color: '#555', fontSize: 13, marginTop: 12 }}>
          <a href="/demo" style={{ color: '#00CFFF', textDecoration: 'none' }}>Or try the browser demo &rarr;</a>
        </p>
      </section>

      {/* RESULTS / PAIN POINTS */}
      <section style={{
        maxWidth: 700, margin: '100px auto 0', padding: '0 24px',
        textAlign: 'center', position: 'relative', zIndex: 10,
      }}>
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 32 }}>
          <p style={{ color: '#fff', fontSize: 20, lineHeight: 1.6, marginBottom: 16 }}>
            &ldquo;The average service business loses 62% of leads to slow follow-up.&rdquo;
          </p>
          <p style={{ color: '#888', fontSize: 15, lineHeight: 1.6 }}>
            AI calling your leads in 5 minutes vs. calling back tomorrow.<br />
            You know which one books.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        maxWidth: 700, margin: '100px auto 0', padding: '0 24px',
        textAlign: 'center', position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(28px, 4vw, 48px)', color: '#fff', letterSpacing: 2, marginBottom: 16 }}>
          BUILD YOUR AI BUSINESS PAGE.<br />FREE FOR 7 DAYS.
        </h2>
        <a href="/auth/signup" style={{
          display: 'block', maxWidth: 500, margin: '0 auto', background: '#00CFFF', color: '#000',
          padding: '16px 32px', borderRadius: 8, fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22, letterSpacing: 2, textDecoration: 'none', textAlign: 'center',
        }}>
          START FREE TRIAL &rarr;
        </a>
        <p style={{ color: '#555', fontSize: 14, marginTop: 12 }}>
          No code. No agency. One prompt.
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{
        maxWidth: 1200, margin: '100px auto 0', padding: '40px 24px 32px',
        borderTop: '1px solid #1A1A1A', position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: '#00CFFF', letterSpacing: 2 }}>
              GoElev8.ai
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Demo', href: '/demo' },
              { label: 'Templates', href: '/templates' },
              { label: 'Support', href: '/support' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'SMS Policy', href: '/sms-policy' },
            ].map((link) => (
              <a key={link.href} href={link.href} style={{ color: '#555', textDecoration: 'none' }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: '#333' }}>
          &copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.
          <br />Powered by Claude and Vapi
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes glitch {
          0%, 90%, 100% { text-shadow: none; }
          92% { text-shadow: -2px 0 #00CFFF, 2px 0 #FF00FF; }
          94% { text-shadow: 2px 0 #00CFFF, -2px 0 #FF00FF; }
          96% { text-shadow: none; }
        }
      `}</style>
    </div>
  );
}
