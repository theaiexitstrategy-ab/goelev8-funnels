// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useState } from 'react';

const GOLD = '#F5B800';
const RED = '#C8102E';
const DISPLAY = '"Bebas Neue", sans-serif';
const BODY = '"Inter", system-ui, -apple-system, sans-serif';

const FEATURE_GROUPS = [
  {
    icon: '🎯',
    title: 'Lead Acquisition Agent',
    items: [
      'Custom AI agent built and embedded on roqbody.com',
      'Greets every site visitor 24/7 — even at 2am',
      'Asks qualifying questions: training, supplements, meal prep, apparel, youth academy',
      'Captures name + phone number automatically',
      'Sends instant automated SMS follow-up with CTA',
      'Routes each lead to the right offer',
      'Logs every lead in your GoElev8.ai dashboard',
    ],
  },
  {
    icon: '💬',
    title: 'Branded SMS Follow-Up System',
    items: [
      'Dedicated ROQ Body phone number (via Twilio)',
      'Automated follow-up sequences for new leads',
      'Booking confirmation messages',
      'Appointment reminders',
      '500 SMS credits included monthly (1 credit = 1 text up to 160 characters)',
    ],
  },
  {
    icon: '📊',
    title: 'Your Client Dashboard',
    items: [
      'Access to portal.goelev8.ai — your own tenant portal',
      'Live lead tracking and contact log',
      'SMS usage and credit balance',
      'Campaign performance at a glance',
    ],
  },
  {
    icon: '🔍',
    title: 'Homepage Audit + Site Brief',
    items: [
      'We analyze your current roqbody.com site',
      'Full copy rewrite recommendation',
      'Page structure built around your 6 revenue streams',
      'Brand extraction: colors, tone, messaging',
      'Delivered as a ready-to-build site brief in your portal',
    ],
  },
  {
    icon: '⚙️',
    title: 'Ongoing Management',
    items: [
      'Aaron Bryant manages and optimizes your agent monthly',
      'You focus on training — we handle the tech',
    ],
  },
];

export default function QsetupClient() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/qsetup/checkout', { method: 'POST' });
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
      <section style={{ padding: '80px 24px 60px', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 999,
          border: `1px solid ${GOLD}55`, background: `${GOLD}11`,
          fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase',
          color: GOLD, marginBottom: 26, fontWeight: 600,
        }}>
          Custom Build for Quantarrius Wilson
        </div>
        <h1 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(48px, 9vw, 96px)', lineHeight: 0.95,
          letterSpacing: 1.5, margin: '0 0 18px', fontWeight: 400,
        }}>
          ROQ Body
          <span style={{ color: GOLD, margin: '0 12px' }}>×</span>
          GoElev8.ai
        </h1>
        <p style={{
          fontFamily: BODY, fontSize: 'clamp(18px, 2.4vw, 22px)',
          color: 'rgba(255,255,255,0.75)', maxWidth: 720, margin: '0 auto',
          lineHeight: 1.5, fontWeight: 300,
        }}>
          Your AI-Powered Growth System — Built and Ready to Launch
        </p>
      </section>

      {/* ── WHAT WE'RE BUILDING ──────────────────────────────────── */}
      <section style={{ padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
          textAlign: 'center', fontWeight: 400,
        }}>
          What We&apos;re <span style={{ color: GOLD }}>Building</span> For You
        </h2>
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: 48,
          maxWidth: 640, marginInline: 'auto', fontSize: 15, lineHeight: 1.55,
        }}>
          Everything below is included in your ROQ Body build, configured by Aaron, and launched ready to convert.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {FEATURE_GROUPS.map((group) => (
            <div
              key={group.title}
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(245,184,0,0.18)',
                borderRadius: 6,
                padding: '26px 24px',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>{group.icon}</div>
              <h3 style={{
                fontFamily: DISPLAY, fontSize: 22, letterSpacing: 1.5,
                textTransform: 'uppercase', color: GOLD, margin: '0 0 14px',
                fontWeight: 400,
              }}>
                {group.title}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {group.items.map((item) => (
                  <li key={item} style={{
                    fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)',
                    padding: '6px 0', display: 'flex', gap: 10,
                  }}>
                    <span style={{
                      color: GOLD, flexShrink: 0, marginTop: 2,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', maxWidth: 880, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 36, fontWeight: 400,
        }}>
          Your <span style={{ color: GOLD }}>Investment</span>
        </h2>

        <div style={{ display: 'grid', gap: 14 }}>
          <PricingLine
            primary="$400"
            primarySuffix="one-time setup fee"
            note="Everything above built, configured, and launched"
          />
          <PricingLine
            primary="$99"
            primarySuffix="/ month"
            note="Platform access, agent management, 500 SMS credits included, dashboard, ongoing optimization"
          />
          <div style={{
            background: '#0a0a0a',
            border: `1px solid ${RED}40`,
            borderLeft: `3px solid ${RED}`,
            borderRadius: 6,
            padding: '22px 24px',
          }}>
            <div style={{
              fontFamily: DISPLAY, fontSize: 36, color: RED, letterSpacing: 1,
              lineHeight: 1, marginBottom: 4, fontWeight: 400,
            }}>
              10%
              <span style={{
                fontFamily: BODY, fontSize: 15, color: 'rgba(255,255,255,0.7)',
                marginLeft: 10, fontWeight: 400,
              }}>
                of transactions processed through your GoElev8.ai site
              </span>
            </div>
            <p style={{ margin: '8px 0 6px', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              Only applies to e-commerce transactions (supplements, apparel, etc.) processed through your GoElev8.ai-powered storefront. Personal training bookings and consultations are excluded.
            </p>
            <p style={{
              margin: '10px 0 0', padding: '10px 12px',
              background: 'rgba(245,184,0,0.06)', borderRadius: 4,
              fontSize: 13, color: GOLD, lineHeight: 1.5,
              borderLeft: `2px solid ${GOLD}55`,
            }}>
              This only kicks in when we&apos;re actively processing sales for you through the platform. If we&apos;re not driving the transaction, you&apos;re not paying the 10%.
            </p>
          </div>
        </div>
      </section>

      {/* ── SMS PRICING CALLOUT ──────────────────────────────────── */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${GOLD}`,
          borderRadius: 8,
          padding: '28px 28px',
          boxShadow: `0 0 0 1px ${GOLD}22, 0 8px 30px rgba(245,184,0,0.05)`,
        }}>
          <p style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: GOLD, margin: '0 0 10px', fontWeight: 600,
          }}>
            A note on SMS
          </p>
          <p style={{ margin: '0 0 18px', fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)' }}>
            SMS credits are separate from your monthly plan. Your plan includes <strong style={{ color: '#fff' }}>500 credits/month</strong>. Need more? Buy credit packs starting at <strong style={{ color: GOLD }}>$25</strong>.
          </p>
          <a
            href="/smscalc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: GOLD, color: '#000',
              padding: '12px 22px',
              borderRadius: 4,
              textDecoration: 'none',
              fontFamily: BODY, fontWeight: 700, fontSize: 13,
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}
          >
            See SMS Pricing & Calculator →
          </a>
        </div>
      </section>

      {/* ── CTA / CHECKOUT ───────────────────────────────────────── */}
      <section style={{
        padding: '60px 24px 40px', maxWidth: 720, margin: '0 auto',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(36px, 6vw, 60px)',
          letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 14px',
          fontWeight: 400,
        }}>
          Ready to <span style={{ color: GOLD }}>Launch?</span>
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.55,
          margin: '0 0 36px', maxWidth: 600, marginInline: 'auto',
        }}>
          Secure your setup with a one-time <strong style={{ color: '#fff' }}>$400</strong> payment.
          Your <strong style={{ color: '#fff' }}>$99/month</strong> subscription starts after your agent goes live.
        </p>

        <button
          type="button"
          onClick={startCheckout}
          disabled={submitting}
          aria-label="Start checkout"
          style={{
            background: GOLD, color: '#000',
            border: 'none',
            padding: '18px 40px',
            borderRadius: 4,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.15s ease',
            boxShadow: `0 6px 22px rgba(245,184,0,0.22)`,
          }}
        >
          {submitting ? 'Loading…' : 'Secure My Setup — $400'}
        </button>

        {error ? (
          <p style={{ marginTop: 14, color: '#ff6b6b', fontSize: 14 }} role="alert">{error}</p>
        ) : null}

        <p style={{
          marginTop: 22, color: 'rgba(255,255,255,0.55)', fontSize: 13,
          lineHeight: 1.55, maxWidth: 520, marginInline: 'auto',
        }}>
          After payment, you&apos;ll be guided through a short onboarding session to collect your brand details. Your agent will be live within 5–7 business days.
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        padding: '40px 24px 30px',
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

function PricingLine({ primary, primarySuffix, note }: {
  primary: string;
  primarySuffix: string;
  note: string;
}) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(245,184,0,0.18)',
      borderRadius: 6,
      padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{
          fontFamily: DISPLAY, fontSize: 36, color: GOLD, letterSpacing: 1,
          lineHeight: 1, fontWeight: 400,
        }}>
          {primary}
        </span>
        <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>{primarySuffix}</span>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
        → {note}
      </p>
    </div>
  );
}
