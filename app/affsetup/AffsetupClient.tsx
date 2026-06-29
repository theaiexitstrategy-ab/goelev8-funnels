// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import { useState } from 'react';

const GOLD = '#F5B800';
const RED = '#C8102E';
const DISPLAY = '"Bebas Neue", sans-serif';
const BODY = '"Inter", system-ui, -apple-system, sans-serif';

const FEATURE_GROUPS = [
  {
    icon: '📞',
    title: '24/7 AI Voice Agent',
    description:
      "A custom-built voice agent that answers calls as A Family's Future — not a generic robot.",
    items: [
      'Answers every inbound call around the clock',
      "Greets callers as A Family's Future Heating & Cooling professionally",
      'Qualifies the call: service type, urgency, new vs existing customer, address, preferred appointment time',
      'Handles all service types: heating, cooling, indoor air quality, tune-ups, emergency calls',
      "Transfers emergency calls directly to Kevin's cell when flagged as urgent",
      'Books confirmed appointments directly into Jobber in real time',
      "Reads Kevin's Jobber availability before booking — no double-booking",
    ],
  },
  {
    icon: '📅',
    title: 'Jobber Integration',
    description:
      'The voice agent books directly into the calendar Kevin already uses — zero new tools to learn.',
    items: [
      "Connects to A Family's Future existing Jobber account",
      'Creates new job records automatically with customer name, address, service type, and appointment time',
      'Respects existing bookings and blocked dates',
      'New and returning customers handled correctly',
      'Kevin sees every booked appointment in Jobber exactly as if he booked it himself',
    ],
  },
  {
    icon: '📱',
    title: 'SMS Confirmation System',
    description:
      'Every booked appointment triggers an automatic confirmation text to the customer.',
    items: [
      'Customer receives SMS confirmation immediately after booking',
      'Includes appointment date, time, and service type',
      'Reminder text sent 24 hours before appointment',
      'Reduces no-shows without Kevin lifting a finger',
      '500 SMS credits included monthly (1 credit = 1 text up to 160 characters)',
    ],
  },
  {
    icon: '📊',
    title: 'Your GoElev8.ai Dashboard',
    description:
      "Kevin's own portal at portal.goelev8.ai — everything in one place.",
    items: [
      'Live call log: every call the agent handled',
      'Booking record: every appointment created',
      'SMS usage and credit balance',
      'Missed call alerts',
      'Access anytime from any device',
    ],
  },
  {
    icon: '⚙️',
    title: 'Ongoing Management',
    description:
      'Aaron manages and optimizes the agent every month so Kevin stays focused on the work.',
    items: [
      'Monthly agent performance review',
      'Script updates as services or pricing change',
      'Call quality monitoring',
      'Page change requests: 24–72 hour turnaround on any updates',
      'Kevin never touches the tech',
    ],
  },
];

const PROCESS_STEPS = [
  {
    n: '01',
    title: 'You Pay the Setup Fee',
    body:
      "Secure your spot with the $400 setup fee. Your $99/month doesn't start until your agent is live.",
  },
  {
    n: '02',
    title: 'Quick Onboarding Session',
    body:
      "After payment, you'll get a link to a short onboarding chat. We'll confirm your services, hours, call handling preferences, and how you want emergencies handled. Takes about 10 minutes.",
  },
  {
    n: '03',
    title: 'We Build Your Agent',
    body:
      'Aaron builds your custom voice agent, connects it to your Jobber account, sets up your dedicated phone number, and tests every scenario.',
  },
  {
    n: '04',
    title: 'You Go Live',
    body:
      'Your new GoElev8.ai number goes live. Forward your main line or use it as your primary number. The agent handles every call from day one.',
  },
  {
    n: '05',
    title: 'Kevin Stays in the Field',
    body:
      'You focus on the job. The agent handles the phones. Every booking shows up in Jobber exactly where you expect it.',
  },
];

export default function AffsetupClient({ adminPhone }: { adminPhone: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/affsetup/checkout', { method: 'POST' });
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
          Custom Build for A Family&apos;s Future Heating &amp; Cooling
        </div>
        <h1 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(44px, 8.4vw, 88px)', lineHeight: 0.95,
          letterSpacing: 1.5, margin: '0 0 18px', fontWeight: 400,
        }}>
          A Family&apos;s Future
          <span style={{ color: GOLD, margin: '0 12px' }}>×</span>
          GoElev8.ai
        </h1>
        <p style={{
          fontFamily: BODY, fontSize: 'clamp(17px, 2.2vw, 21px)',
          color: 'rgba(255,255,255,0.78)', maxWidth: 740, margin: '0 auto',
          lineHeight: 1.5, fontWeight: 300,
        }}>
          A 24/7 AI Voice Agent That Answers Every Call, Qualifies Every Customer, and Books Directly Into Jobber — While Kevin&apos;s in the Field.
        </p>
      </section>

      {/* ── THE PROBLEM WE'RE SOLVING ────────────────────────────── */}
      <section style={{ padding: '20px 24px 40px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${RED}40`,
          borderLeft: `4px solid ${RED}`,
          borderRadius: 6,
          padding: '28px 28px',
        }}>
          <p style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: RED, margin: '0 0 10px', fontWeight: 700,
          }}>
            The problem we&apos;re solving
          </p>
          <h2 style={{
            fontFamily: DISPLAY, fontSize: 'clamp(28px, 4.4vw, 40px)',
            letterSpacing: 1.5, margin: '0 0 18px', fontWeight: 400,
          }}>
            Every Missed Call Is a Missed Job
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)' }}>
            When Kevin&apos;s on a job, calls go to voicemail. Customers in St. Louis don&apos;t wait — they call the next HVAC company on Google. A Family&apos;s Future loses the booking before they ever knew about it.
          </p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)' }}>
            GoElev8.ai fixes that. A custom AI voice agent answers every call, 24/7, asks the right questions, and books the appointment directly into Jobber. <strong style={{ color: '#fff' }}>No missed calls. No lost jobs. No extra staff.</strong>
          </p>
        </div>
      </section>

      {/* ── SCOPE OF WORK ────────────────────────────────────────── */}
      <section style={{ padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
          textAlign: 'center', fontWeight: 400,
        }}>
          What&apos;s <span style={{ color: GOLD }}>Included</span>
        </h2>
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: 48,
          maxWidth: 660, marginInline: 'auto', fontSize: 15, lineHeight: 1.55,
        }}>
          Everything below is built, configured, tested, and launched before A Family&apos;s Future pays a single dollar of monthly fees.
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
                textTransform: 'uppercase', color: GOLD, margin: '0 0 10px',
                fontWeight: 400,
              }}>
                {group.title}
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)' }}>
                {group.description}
              </p>
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
          marginBottom: 8, fontWeight: 400,
        }}>
          Simple, Transparent <span style={{ color: GOLD }}>Pricing</span>
        </h2>
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: 36,
          fontSize: 15, lineHeight: 1.55,
        }}>
          No contracts. No surprises. Cancel anytime.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          <PricingLine
            primary="$400"
            primarySuffix="one-time setup fee"
            note="Everything above built, configured, tested, and launched. Voice agent live and connected to Jobber before you pay a single dollar of monthly fees."
          />
          <PricingLine
            primary="$99"
            primarySuffix="/ month"
            note="Covers your GoElev8.ai platform access, voice agent management, 500 SMS credits, your client dashboard, and Aaron's ongoing optimization. Think of it like a utility bill that actively makes you money."
          />
          <div style={{
            background: '#0a0a0a',
            border: `1px solid ${RED}40`,
            borderLeft: `3px solid ${RED}`,
            borderRadius: 6,
            padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <span style={{
                fontFamily: DISPLAY, fontSize: 36, color: RED, letterSpacing: 1,
                lineHeight: 1, fontWeight: 400,
              }}>
                $10
              </span>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>
                per booked appointment
              </span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              → Only applies to appointments booked directly by the GoElev8.ai voice agent into Jobber. If the agent doesn&apos;t book it, you don&apos;t pay it. This keeps us incentivized to make sure the agent performs.
            </p>
          </div>
        </div>

        {/* Callout */}
        <div style={{
          marginTop: 22,
          background: '#0a0a0a',
          border: `1px solid ${GOLD}`,
          borderRadius: 8,
          padding: '22px 24px',
          boxShadow: `0 0 0 1px ${GOLD}22, 0 8px 30px rgba(245,184,0,0.05)`,
        }}>
          <p style={{
            margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)',
          }}>
            At an average HVAC service call value of <strong style={{ color: GOLD }}>$150–$300</strong>, the agent pays for itself with <strong style={{ color: '#fff' }}>1–2 bookings per month</strong>. Everything after that is pure upside.
          </p>
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
            SMS credits are included with your plan. <strong style={{ color: '#fff' }}>500 credits/month</strong> covers all your booking confirmations and appointment reminders. Need more for marketing campaigns? Credit packs start at <strong style={{ color: GOLD }}>$25</strong>.
          </p>
          <a
            href="https://goelev8.ai/smscalc"
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
            See SMS Pricing &amp; Calculator →
          </a>
        </div>
      </section>

      {/* ── WHAT HAPPENS AFTER YOU SIGN UP ───────────────────────── */}
      <section style={{ padding: '40px 24px 20px', maxWidth: 980, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 40px)',
          letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 12, fontWeight: 400,
        }}>
          You&apos;re Live in <span style={{ color: GOLD }}>5–7 Business Days</span>
        </h2>
        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.55)', marginBottom: 40,
          fontSize: 15, lineHeight: 1.55,
        }}>
          Here&apos;s exactly what happens between now and your agent answering its first call.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          {PROCESS_STEPS.map((step) => (
            <div key={step.n} style={{
              background: '#0a0a0a',
              border: '1px solid rgba(245,184,0,0.18)',
              borderRadius: 6,
              padding: '22px 24px',
              display: 'flex',
              gap: 22,
              alignItems: 'flex-start',
            }}>
              <div style={{
                fontFamily: DISPLAY, fontSize: 36, color: GOLD,
                lineHeight: 1, letterSpacing: 1, flexShrink: 0,
                minWidth: 56, fontWeight: 400,
              }}>
                {step.n}
              </div>
              <div>
                <h3 style={{
                  fontFamily: DISPLAY, fontSize: 20, letterSpacing: 1.2,
                  textTransform: 'uppercase', color: '#fff', margin: '0 0 8px',
                  fontWeight: 400,
                }}>
                  {step.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
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
          Ready to Stop <span style={{ color: GOLD }}>Missing Calls?</span>
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.72)', fontSize: 17, lineHeight: 1.55,
          margin: '0 0 36px', maxWidth: 600, marginInline: 'auto',
        }}>
          Setup takes less than a week. Your first missed-call recovery pays for the whole month.
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
          {submitting ? 'Loading…' : 'Get Started — $400 Setup Fee'}
        </button>

        {error ? (
          <p style={{ marginTop: 14, color: '#ff6b6b', fontSize: 14 }} role="alert">{error}</p>
        ) : null}

        <p style={{
          marginTop: 22, color: 'rgba(255,255,255,0.55)', fontSize: 13,
          lineHeight: 1.6, maxWidth: 560, marginInline: 'auto',
        }}>
          After payment, you&apos;ll receive a link to a 10-minute onboarding session. Your agent will be live within 5–7 business days.
          {adminPhone ? (
            <>
              <br />
              Questions? Text or call Aaron directly:{' '}
              <a href={`tel:${adminPhone.replace(/\D/g, '')}`} style={{ color: GOLD, textDecoration: 'none' }}>
                {adminPhone}
              </a>
            </>
          ) : (
            <>
              <br />
              Questions?{' '}
              <a href="mailto:ab@goelev8.ai" style={{ color: GOLD, textDecoration: 'none' }}>
                ab@goelev8.ai
              </a>
            </>
          )}
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
