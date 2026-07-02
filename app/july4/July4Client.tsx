// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useState } from 'react';

const GOLD = '#F5B800';
const RED = '#C8102E';
const DISPLAY = '"Bebas Neue", sans-serif';
const BODY = '"Inter", system-ui, -apple-system, sans-serif';

// Everything-included package — union of features across all three
// currently-live client packages (Leslie, Kevin, Quantarrius). Grouped
// so the reader can scan by category on mobile.
const FEATURE_GROUPS: { icon: string; title: string; items: string[] }[] = [
  {
    icon: '🌐',
    title: 'Website + Domain',
    items: [
      'Custom website designed and built for your business',
      'Domain purchase, setup, and hosting handled for you',
      'Migration from existing platform (Wix, Squarespace, etc.)',
      'Homepage audit + rewritten copy where needed',
    ],
  },
  {
    icon: '📞',
    title: '24/7 AI Voice Agent',
    items: [
      'Answers every inbound call around the clock',
      'Qualifies callers and books into your calendar',
      'Handles emergencies with direct transfer to you',
      'Integrates with Jobber, GlossGenius, Google Calendar, and more',
    ],
  },
  {
    icon: '💬',
    title: 'AI Lead Agent + SMS',
    items: [
      'AI chat agent on your site captures leads 24/7',
      'Branded SMS follow-up from your dedicated number',
      'Automated appointment confirmations + reminders',
      '500 SMS credits included every month',
    ],
  },
  {
    icon: '🛒',
    title: 'Merch Store',
    items: [
      'Your own storefront at shop.goelev8.ai/[you]',
      'Sell products, programs, apparel, or supplements',
      'Payments processed directly to you via Stripe',
      'Tied into your dashboard and SMS follow-ups',
    ],
  },
  {
    icon: '📊',
    title: 'Client Dashboard',
    items: [
      'Your own portal at portal.goelev8.ai',
      'Live lead + booking log',
      'SMS usage and credit balance',
      'Call log and missed-call alerts',
    ],
  },
  {
    icon: '🔍',
    title: 'SEO Boost',
    items: [
      'Local search visibility improvements',
      'Google Business Profile setup + optimization',
      'On-page keyword + metadata optimization',
    ],
  },
  {
    icon: '⚙️',
    title: 'Ongoing Management',
    items: [
      'Aaron manages and optimizes your setup every month',
      'Page change requests: 24–72 hour turnaround',
      'Script updates as your services or pricing change',
      'You focus on your business — we handle the tech',
    ],
  },
];

export default function July4Client() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/july4/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_slug: 'presence-full' }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Checkout could not start. Try again.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: BODY }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ padding: '70px 24px 30px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '8px 16px', borderRadius: 999,
          border: `1px solid ${RED}77`, background: `${RED}18`,
          fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
          color: '#ff8080', marginBottom: 26, fontWeight: 700,
        }}>
          🎇 July 4th Weekend Only
        </div>

        <h1 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(64px, 12vw, 128px)', lineHeight: 0.9,
          letterSpacing: 2, margin: '0 0 12px', fontWeight: 400,
        }}>
          50% <span style={{ color: RED }}>OFF</span>
        </h1>
        <p style={{
          fontFamily: DISPLAY, fontSize: 'clamp(26px, 3.6vw, 38px)',
          letterSpacing: 2, margin: '0 0 22px', color: '#fff',
        }}>
          Your <span style={{ color: GOLD }}>GoElev8.AI</span> Setup Fee
        </p>
        <p style={{
          fontFamily: BODY, fontSize: 'clamp(16px, 1.8vw, 18px)',
          color: 'rgba(255,255,255,0.75)', maxWidth: 640, margin: '0 auto 10px',
          lineHeight: 1.55, fontWeight: 300,
        }}>
          <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>$400</span>
          {' '}<strong style={{ color: '#fff' }}>$200</strong> today — one price, everything included.
        </p>
        <p style={{
          fontFamily: BODY, fontSize: 14,
          color: 'rgba(255,255,255,0.55)', margin: '0 auto',
          maxWidth: 540, lineHeight: 1.6,
        }}>
          Your $99/month platform fee doesn&apos;t start until your build is live. Setup ships within 5–7 business days.
        </p>
      </section>

      {/* ── SINGLE CTA CARD (top) ────────────────────────────────── */}
      <section style={{ padding: '10px 24px 24px', maxWidth: 620, margin: '0 auto' }}>
        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${GOLD}66`,
          borderRadius: 10,
          padding: '26px 24px',
          boxShadow: `0 0 0 1px ${GOLD}22, 0 12px 40px rgba(245,184,0,0.08)`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              fontFamily: DISPLAY, fontSize: 56, color: GOLD,
              letterSpacing: 1, lineHeight: 1, fontWeight: 400,
            }}>
              $200
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
              $400
            </span>
          </div>
          <p style={{
            margin: '0 0 20px', fontSize: 13,
            color: 'rgba(255,255,255,0.65)', letterSpacing: 2,
            textTransform: 'uppercase', fontWeight: 600,
          }}>
            One-time setup · Everything included
          </p>
          <button
            onClick={startCheckout}
            disabled={submitting}
            style={{
              background: GOLD,
              color: '#000',
              border: 'none',
              padding: '18px 32px',
              borderRadius: 4,
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.15s ease',
              boxShadow: `0 6px 22px rgba(245,184,0,0.28)`,
              width: '100%',
              maxWidth: 420,
            }}
          >
            {submitting ? 'Loading…' : 'Claim 50% Off — $200 Setup'}
          </button>
          {error ? (
            <p style={{ marginTop: 14, color: '#ff6b6b', fontSize: 13 }} role="alert">
              {error}
            </p>
          ) : null}
          <p style={{
            marginTop: 14, color: 'rgba(255,255,255,0.5)',
            fontSize: 12, lineHeight: 1.6, maxWidth: 380, margin: '14px auto 0',
          }}>
            Secure checkout via Stripe · Discount applied automatically
          </p>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ──────────────────────────────────────── */}
      <section style={{ padding: '40px 24px 30px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, textTransform: 'uppercase',
          textAlign: 'center', marginBottom: 12, fontWeight: 400,
        }}>
          Everything <span style={{ color: GOLD }}>Included</span>
        </h2>
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: 36,
          maxWidth: 620, marginInline: 'auto', fontSize: 15, lineHeight: 1.6,
        }}>
          One flat setup fee. No à la carte pricing. Everything you need to launch, grow, and run your business with AI.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18,
        }}>
          {FEATURE_GROUPS.map((group) => (
            <div
              key={group.title}
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(245,184,0,0.18)',
                borderRadius: 6,
                padding: '24px 22px',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{group.icon}</div>
              <h3 style={{
                fontFamily: DISPLAY, fontSize: 20, letterSpacing: 1.5,
                textTransform: 'uppercase', color: GOLD, margin: '0 0 12px',
                fontWeight: 400,
              }}>
                {group.title}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {group.items.map((item) => (
                  <li key={item} style={{
                    fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)',
                    padding: '5px 0', display: 'flex', gap: 10,
                  }}>
                    <span style={{
                      color: GOLD, flexShrink: 0, marginTop: 2,
                      fontSize: 11, fontWeight: 700,
                    }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section style={{
        padding: '30px 24px 20px', maxWidth: 620, margin: '0 auto',
        textAlign: 'center',
      }}>
        <button
          onClick={startCheckout}
          disabled={submitting}
          style={{
            background: GOLD,
            color: '#000',
            border: 'none',
            padding: '18px 32px',
            borderRadius: 4,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.15s ease',
            boxShadow: `0 6px 22px rgba(245,184,0,0.28)`,
            width: '100%',
            maxWidth: 420,
          }}
        >
          {submitting ? 'Loading…' : 'Claim 50% Off — $200 Setup'}
        </button>
      </section>

      {/* ── FINE PRINT ───────────────────────────────────────────── */}
      <section style={{ padding: '20px 24px 60px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${GOLD}44`,
          borderRadius: 6,
          padding: '20px 22px',
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.7,
        }}>
          <p style={{ margin: '0 0 8px', color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
            Promo details
          </p>
          Promo code <strong style={{ color: '#fff' }}>JULY4TH50</strong> · Valid for the first 25 redemptions · Expires July 7, 2026 at 11:59 PM CT · One-time discount applies to your setup fee only · Cannot be combined with other promos.
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        padding: '30px 24px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        lineHeight: 1.55,
      }}>
        © 2026 GoElev8.AI · Infinite Possibilities with AI · Aaron Bryant.<br />
        <a href="https://goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>goelev8.ai</a>
      </footer>
    </div>
  );
}
