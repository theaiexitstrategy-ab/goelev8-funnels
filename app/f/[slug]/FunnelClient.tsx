'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';

type FunnelData = {
  id: string;
  slug: string;
  name: string;
  accent_color: string;
  hero_headline: string;
  hero_subheadline: string;
  offer_text: string;
  cta_text: string;
  feature_1_title: string;
  feature_1_body: string;
  feature_2_title: string;
  feature_2_body: string;
  feature_3_title: string;
  feature_3_body: string;
  feature_4_title: string;
  feature_4_body: string;
  industry: string;
  city: string;
  is_claimed: boolean;
  is_expired: boolean;
  expires_at: string | null;
};

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

export default function FunnelClient({ funnel }: { funnel: FunnelData }) {
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const accent = funnel.accent_color;

  // ── Expired page ──
  if (funnel.is_expired) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏱</div>
          <h1 style={{ fontSize: 32, color: '#fff', marginBottom: 12, fontWeight: 700 }}>
            This page has expired.
          </h1>
          <p style={{ fontSize: 15, color: '#999', lineHeight: 1.6, marginBottom: 24 }}>
            Unclaimed pages expire after 24 hours. Build a new one in 20 seconds.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', background: '#00CFFF', color: '#000',
              padding: '14px 32px', borderRadius: 6, fontSize: 16, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            BUILD A NEW PAGE →
          </a>
          <div style={{ marginTop: 16, fontSize: 11, color: '#555' }}>
            Powered by <a href="https://goelev8.ai" style={{ color: '#555' }}>GoElev8.AI</a>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/funnel/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_slug: funnel.slug,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          source: 'funnel',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const features = [
    { title: funnel.feature_1_title, body: funnel.feature_1_body },
    { title: funnel.feature_2_title, body: funnel.feature_2_body },
    { title: funnel.feature_3_title, body: funnel.feature_3_body },
    { title: funnel.feature_4_title, body: funnel.feature_4_body },
  ].filter(f => f.title);

  const formDisabled = !funnel.is_claimed;

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
    }}>
      {/* ── Claim banner for unclaimed pages ── */}
      {!funnel.is_claimed && funnel.expires_at && (
        <div style={{
          background: `linear-gradient(90deg, ${accent}, #FF6B35)`,
          color: '#000', textAlign: 'center', padding: '10px 16px',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, flexWrap: 'wrap',
        }}>
          <span>This page expires in <CountdownTimer expiresAt={funnel.expires_at} /></span>
          <a
            href={`/auth/signup?slug=${funnel.slug}&funnel_id=${funnel.id}`}
            style={{
              background: '#000', color: '#fff', padding: '5px 14px',
              borderRadius: 4, textDecoration: 'none', fontSize: 12, fontWeight: 700,
            }}
          >
            Claim it free →
          </a>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{
        padding: '80px 20px 60px', textAlign: 'center', maxWidth: 720,
        margin: '0 auto',
      }}>
        {funnel.city && (
          <div style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            color: accent, marginBottom: 16, fontWeight: 600,
          }}>
            {funnel.industry !== 'other' ? `${funnel.industry} · ${funnel.city}` : funnel.city}
          </div>
        )}

        <h1 style={{
          fontSize: 'clamp(32px, 7vw, 56px)', fontWeight: 800,
          lineHeight: 1.05, marginBottom: 16, letterSpacing: '-0.01em',
        }}>
          {funnel.hero_headline}
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#aaa',
          lineHeight: 1.6, maxWidth: 540, margin: '0 auto 32px',
        }}>
          {funnel.hero_subheadline}
        </p>

        {funnel.offer_text && (
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
            padding: '10px 20px', fontSize: 14, color: accent, fontWeight: 600,
          }}>
            {funnel.offer_text}
          </div>
        )}
      </section>

      {/* ── Lead form ── */}
      <section style={{
        maxWidth: 480, margin: '0 auto', padding: '0 20px 60px',
      }}>
        <div style={{
          background: '#111', border: '1px solid #222', borderRadius: 12,
          padding: 32, position: 'relative',
        }}>
          {/* Overlay for unclaimed pages */}
          {formDisabled && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
              borderRadius: 12, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', zIndex: 2,
              padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Claim this page to activate your lead system
              </div>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
                The form, SMS sequence, and AI phone agent activate when you claim this page.
              </p>
              <a
                href={`/auth/signup?slug=${funnel.slug}&funnel_id=${funnel.id}`}
                style={{
                  background: accent, color: '#000', padding: '12px 28px',
                  borderRadius: 6, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}
              >
                ACTIVATE THIS FORM →
              </a>
            </div>
          )}

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You&apos;re in!</div>
              <p style={{ fontSize: 14, color: '#999', lineHeight: 1.5 }}>
                We&apos;ll reach out shortly. Keep an eye on your phone.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333', borderRadius: 6, padding: '12px 14px',
                    color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333', borderRadius: 6, padding: '12px 14px',
                    color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333', borderRadius: 6, padding: '12px 14px',
                    color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {formError && (
                <div style={{
                  fontSize: 12, color: '#FF3B3B', marginBottom: 12,
                }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || formDisabled}
                style={{
                  width: '100%', background: accent, color: '#000',
                  border: 'none', borderRadius: 6, padding: 14,
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.02em',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'SUBMITTING...' : funnel.cta_text}
              </button>

              <p style={{
                fontSize: 10, color: '#555', textAlign: 'center',
                marginTop: 10, lineHeight: 1.4,
              }}>
                By submitting, you agree to receive SMS messages. Msg & data rates may apply.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      {features.length > 0 && (
        <section style={{
          maxWidth: 720, margin: '0 auto', padding: '0 20px 80px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#111', border: '1px solid #222',
                borderRadius: 10, padding: 24,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: accent,
                  letterSpacing: 1, marginBottom: 8,
                }}>
                  {f.title}
                </div>
                <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{
        textAlign: 'center', padding: '24px 16px 40px',
        borderTop: '1px solid #111',
      }}>
        <a
          href="https://goelev8.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#444', textDecoration: 'none', fontSize: 11 }}
        >
          Powered by GoElev8.AI
        </a>
      </footer>
    </div>
  );
}
