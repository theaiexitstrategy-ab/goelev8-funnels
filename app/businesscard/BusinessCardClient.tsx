// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';

/* ── goElev8 cyber-noir palette (matches the homepage) ─────────────── */
const BLK = '#000000';
const PANEL = '#0b0b0d';
const PANEL2 = '#111114';
const CYAN = '#00CFFF';
const GOLD = '#C9A84C';
const GRN = '#00FF94';
const TEXT = '#F5F5F5';
const MUTED = '#9a9a9a';
const DIM = '#5f5f5f';
const LINE = '#1e1e1e';

const FD = '"Bebas Neue", sans-serif';
const FB = '"DM Sans", system-ui, -apple-system, sans-serif';
const FM = '"JetBrains Mono", monospace';

const CONTACT = {
  name: 'Aaron Bryant',
  role: 'Founder & AI Automation Strategist',
  book: 'https://book.goelev8.ai/go',
  site: 'goelev8.ai',
  siteUrl: 'https://goelev8.ai',
  instagram: 'https://instagram.com/goelev8.ai',
  facebook: 'https://facebook.com/profile.php?id=61579676398655',
  city: 'St. Louis, MO',
};

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

type CallState = 'idle' | 'calling' | 'sent' | 'error';

export default function BusinessCardClient() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<CallState>('idle');
  const [error, setError] = useState('');

  const callMe = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid US mobile number.');
      return;
    }
    setError('');
    setState('calling');
    try {
      const res = await fetch('/api/demo/trigger-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      });
      if (!res.ok) {
        setError("The AI couldn't connect right now — book a call and Aaron will demo it live.");
        setState('error');
        return;
      }
      setTimeout(() => setState('sent'), 2500);
    } catch {
      setError("Network hiccup — book a call and Aaron will demo it live.");
      setState('error');
    }
  }, [phone]);

  const saveContact = useCallback(() => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Bryant;Aaron;;;',
      'FN:Aaron Bryant',
      'ORG:GoElev8.ai',
      'TITLE:Founder & AI Automation Strategist',
      'URL:https://goelev8.ai',
      'URL;TYPE=Book a call:https://book.goelev8.ai/go',
      'X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/goelev8.ai',
      'ADR;TYPE=WORK:;;;St. Louis;MO;;USA',
      'NOTE:Custom AI agents that answer, qualify & book — 24/7. Book: book.goelev8.ai/go',
      'END:VCARD',
    ].join('\r\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aaron-Bryant-GoElev8.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  return (
    <main style={{
      background: BLK, color: TEXT, fontFamily: FB, minHeight: '100vh',
      display: 'flex', justifyContent: 'center',
      padding: '28px 18px 40px',
    }}>
      {/* subtle brand glow */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(70% 45% at 50% 0%, rgba(0,207,255,0.08) 0%, transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          <Image src="/images/goelev8-full-logo.png" alt="GoElev8.ai" width={72} height={72}
            style={{ width: 72, height: 72, display: 'block' }} priority />
        </div>

        {/* Identity */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <div style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '2.4px', textTransform: 'uppercase', color: CYAN }}>
            Custom AI Agents · {CONTACT.city}
          </div>
          <h1 style={{
            margin: '12px 0 0', fontFamily: FD, fontWeight: 400,
            fontSize: 'clamp(42px, 13vw, 58px)', lineHeight: 0.95, letterSpacing: '1px',
          }}>
            {CONTACT.name}
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: GOLD, fontWeight: 500, letterSpacing: '0.3px' }}>
            {CONTACT.role}
          </div>
          <p style={{ margin: '14px auto 0', maxWidth: 360, fontSize: 14.5, color: MUTED, lineHeight: 1.6 }}>
            I build custom AI agents that answer every call and text, qualify the lead, and book the
            appointment — <strong style={{ color: TEXT, fontWeight: 600 }}>24/7, live in 48 hours.</strong>
          </p>
        </div>

        {/* Live demo — talk to the AI */}
        <section style={{
          marginTop: 24, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14,
          padding: 20, boxShadow: '0 0 0 1px rgba(0,207,255,0.06), 0 18px 44px rgba(0,0,0,0.5)',
        }}>
          {state !== 'sent' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: GRN, flexShrink: 0 }} />
                <span style={{ fontFamily: FM, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: GRN }}>
                  Live AI · try it now
                </span>
              </div>
              <h2 style={{ margin: '12px 0 0', fontFamily: FD, fontWeight: 400, fontSize: 26, letterSpacing: '0.5px' }}>
                Talk to my AI
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.55 }}>
                Enter your cell — Lev calls you in about 10 seconds. It&apos;s the same AI that would
                answer your business line.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(314) 555-0123"
                  aria-label="Your cell phone"
                  disabled={state === 'calling'}
                  style={{
                    flex: '1 1 150px', minWidth: 0, boxSizing: 'border-box',
                    background: BLK, border: `1px solid ${LINE}`, borderRadius: 8,
                    padding: '13px 14px', color: TEXT, fontFamily: FB, fontSize: 16, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={callMe}
                  disabled={state === 'calling'}
                  style={{
                    flex: '1 1 140px', background: CYAN, color: BLK, border: 'none', borderRadius: 8,
                    padding: '13px 18px', fontFamily: FM, fontWeight: 600, fontSize: 12.5,
                    letterSpacing: '1px', textTransform: 'uppercase', cursor: state === 'calling' ? 'wait' : 'pointer',
                    opacity: state === 'calling' ? 0.7 : 1,
                  }}
                >
                  {state === 'calling' ? 'Calling…' : 'Call Me Now →'}
                </button>
              </div>
              {error && (
                <p role="alert" style={{ margin: '10px 0 0', fontSize: 12.5, color: '#FF6B6B', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto',
                display: 'grid', placeItems: 'center', fontSize: 24,
                background: 'rgba(0,255,148,0.1)', border: `1px solid ${GRN}`, color: GRN,
              }}>✓</div>
              <h2 style={{ margin: '14px 0 0', fontFamily: FD, fontWeight: 400, fontSize: 24, letterSpacing: '0.5px' }}>
                Lev is calling you now
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.55 }}>
                Pick up and hear exactly what your leads would hear.
              </p>
              <button type="button" onClick={() => { setState('idle'); setPhone(''); }}
                style={{ marginTop: 14, background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, borderRadius: 8, padding: '9px 16px', fontFamily: FM, fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', cursor: 'pointer' }}>
                Call again
              </button>
            </div>
          )}
        </section>

        {/* Primary actions */}
        <a href={CONTACT.book} target="_blank" rel="noopener noreferrer" style={{
          marginTop: 12, display: 'block', textAlign: 'center', background: GOLD, color: BLK,
          borderRadius: 8, padding: '15px 18px', fontFamily: FM, fontWeight: 600, fontSize: 13,
          letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none',
        }}>
          Book a Call →
        </a>
        <button type="button" onClick={saveContact} style={{
          marginTop: 10, width: '100%', textAlign: 'center', background: 'transparent', color: TEXT,
          border: `1px solid ${LINE}`, borderRadius: 8, padding: '14px 18px', fontFamily: FM, fontWeight: 500,
          fontSize: 12.5, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Save My Contact
        </button>

        {/* Links */}
        <div style={{
          marginTop: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10,
        }}>
          {[
            ['Website', CONTACT.siteUrl],
            ['Instagram', CONTACT.instagram],
            ['Facebook', CONTACT.facebook],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: FM, fontSize: 11.5, letterSpacing: '0.8px', color: MUTED, textDecoration: 'none',
              border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 14px', background: PANEL2,
            }}>
              {label}
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 26, textAlign: 'center', fontFamily: FM, fontSize: 10.5, color: DIM, letterSpacing: '0.5px' }}>
          {CONTACT.site} · © {2026} GoElev8.ai
        </div>
      </div>
    </main>
  );
}
