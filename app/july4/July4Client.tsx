// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useState } from 'react';

const GOLD = '#F5B800';
const RED = '#C8102E';
const WHITE_BLUE = '#3B82F6';
const DISPLAY = '"Bebas Neue", sans-serif';
const BODY = '"Inter", system-ui, -apple-system, sans-serif';

type OfferKey = 'roqbody' | 'afff';

const OFFERS: {
  key: OfferKey;
  headline: string;
  subhead: string;
  bullets: string[];
  accent: string;
}[] = [
  {
    key: 'roqbody',
    headline: 'ROQ Body Setup',
    subhead: 'Presence Tier — Custom AI Lead Agent',
    bullets: [
      'Custom AI lead agent embedded on roqbody.com',
      'Branded SMS follow-up (500 credits/mo included)',
      'Client dashboard at portal.goelev8.ai',
      'Homepage audit + site brief',
      'Wix → GoElev8.ai platform migration',
      'Ongoing management',
    ],
    accent: GOLD,
  },
  {
    key: 'afff',
    headline: 'AFF HVAC Setup',
    subhead: 'Presence Tier — 24/7 AI Voice Agent',
    bullets: [
      '24/7 AI voice agent — answers every call',
      'Books directly into Jobber (no double-booking)',
      'SMS confirmation + 24h reminders',
      'Client dashboard at portal.goelev8.ai',
      'Emergency call transfer',
      'Ongoing management',
    ],
    accent: WHITE_BLUE,
  },
];

export default function July4Client() {
  const [submitting, setSubmitting] = useState<OfferKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(key: OfferKey) {
    setSubmitting(key);
    setError(null);
    try {
      const res = await fetch('/api/july4/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_slug: key }),
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
      setSubmitting(null);
    }
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: BODY }}>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ padding: '70px 24px 40px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        {/* Discount banner */}
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
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, margin: '0 0 24px', color: '#fff',
        }}>
          Your GoElev8.ai <span style={{ color: GOLD }}>Setup Fee</span>
        </p>
        <p style={{
          fontFamily: BODY, fontSize: 'clamp(17px, 2vw, 20px)',
          color: 'rgba(255,255,255,0.75)', maxWidth: 620, margin: '0 auto 8px',
          lineHeight: 1.5, fontWeight: 300,
        }}>
          <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>$400</span>
          {' '}<strong style={{ color: '#fff' }}>$200</strong> today.
        </p>
        <p style={{
          fontFamily: BODY, fontSize: 14,
          color: 'rgba(255,255,255,0.55)', margin: '0 auto',
          maxWidth: 520, lineHeight: 1.6,
        }}>
          Your $99/month platform fee doesn&apos;t start until your build is live. Setup takes 5–7 business days from payment.
        </p>
      </section>

      {/* ── OFFERS ───────────────────────────────────────────────── */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
          color: GOLD, margin: '0 0 24px', fontWeight: 700,
        }}>
          Pick your setup
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {OFFERS.map((offer) => (
            <div
              key={offer.key}
              style={{
                background: '#0a0a0a',
                border: `1px solid ${offer.accent}55`,
                borderRadius: 8,
                padding: '30px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div>
                <h2 style={{
                  fontFamily: DISPLAY, fontSize: 32, letterSpacing: 1.5,
                  textTransform: 'uppercase', margin: '0 0 6px',
                  color: '#fff', fontWeight: 400,
                }}>
                  {offer.headline}
                </h2>
                <p style={{
                  margin: 0, fontSize: 13, color: offer.accent,
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  {offer.subhead}
                </p>
              </div>

              {/* Price */}
              <div style={{
                background: '#000', border: `1px solid ${offer.accent}33`,
                borderRadius: 6, padding: '16px 18px',
                display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: DISPLAY, fontSize: 46, color: offer.accent,
                  letterSpacing: 1, lineHeight: 1, fontWeight: 400,
                }}>
                  $200
                </span>
                <span style={{
                  fontSize: 15, color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'line-through',
                }}>
                  $400
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  one-time setup
                </span>
              </div>

              {/* Bullets */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {offer.bullets.map((b) => (
                  <li key={b} style={{
                    fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)',
                    padding: '5px 0', display: 'flex', gap: 10,
                  }}>
                    <span style={{
                      color: offer.accent, flexShrink: 0, marginTop: 2,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => startCheckout(offer.key)}
                disabled={submitting !== null}
                style={{
                  background: offer.accent,
                  color: '#000',
                  border: 'none',
                  padding: '16px 22px',
                  borderRadius: 4,
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: submitting !== null ? 'wait' : 'pointer',
                  opacity: submitting !== null && submitting !== offer.key ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: `0 6px 22px ${offer.accent}33`,
                  marginTop: 4,
                }}
              >
                {submitting === offer.key ? 'Loading…' : `Claim ${offer.headline} — $200`}
              </button>
            </div>
          ))}
        </div>

        {error ? (
          <p style={{
            marginTop: 22, color: '#ff6b6b', fontSize: 14,
            textAlign: 'center',
          }} role="alert">{error}</p>
        ) : null}

        <p style={{
          marginTop: 32, textAlign: 'center',
          color: 'rgba(255,255,255,0.55)', fontSize: 13,
          lineHeight: 1.6, maxWidth: 560, marginInline: 'auto',
        }}>
          Discount applied automatically at Stripe checkout. After payment you&apos;ll go through a short onboarding session; your build ships within 5–7 business days.
        </p>
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
        © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.<br />
        <a href="https://goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>goelev8.ai</a>
      </footer>
    </div>
  );
}
