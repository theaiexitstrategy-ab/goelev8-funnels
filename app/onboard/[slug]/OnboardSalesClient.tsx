// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';
import type { OnboardingConfig } from '@/lib/onboarding-configs';

// Theme matches goelev8.ai — black background, cyan #00CFFF accent,
// Bebas Neue display + DM Sans body (loaded globally in app/layout.tsx).
// Per-client accentColor from CLIENT_CONFIG is intentionally NOT used as the
// page accent — the buyer is on goelev8.ai, so the page reads as goelev8.ai.

const CYAN = '#00CFFF';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';
const DISPLAY_FONT = '"Bebas Neue", sans-serif';

export default function OnboardSalesClient({ cfg }: { cfg: OnboardingConfig }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboard/checkout?slug=${encodeURIComponent(cfg.slug)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Checkout could not start. Try again in a moment.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const setupFmt = `$${(cfg.setupFeeCents / 100).toFixed(0)}`;
  const monthlyFmt = `$${(cfg.monthlyPriceCents / 100).toFixed(0)}`;

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: BODY_FONT, fontWeight: 300 }}
    >
      {/* Cyan scanline overlay — same as homepage */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)',
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <a href="/" className="inline-flex items-center" aria-label="GoElev8.ai home">
          <img
            src="/images/goelev8-full-logo.png"
            alt="GoElev8.ai — Infinite Possibilities"
            width={60}
            height={60}
            style={{ display: 'block' }}
          />
        </a>
        <a
          href="/"
          className="text-[11px] uppercase tracking-[2px] text-white/40 hover:text-white/70 transition"
          style={{ fontFamily: BODY_FONT }}
        >
          ← Home
        </a>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-24">
        <p
          className="mb-5 text-[11px] uppercase"
          style={{ color: CYAN, letterSpacing: '2.5px', fontFamily: BODY_FONT, fontWeight: 500 }}
        >
          For {cfg.businessName}
        </p>

        <h1
          className="mb-6 leading-[0.95] uppercase"
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(44px, 6.2vw, 86px)',
            letterSpacing: '1.5px',
            fontWeight: 400,
          }}
        >
          Your digital presence,
          <br />
          <span style={{ color: CYAN }}>built for you.</span>
        </h1>

        <p
          className="max-w-2xl mb-12 text-white/65"
          style={{ fontSize: 17, lineHeight: 1.6, fontFamily: BODY_FONT, fontWeight: 300 }}
        >
          {cfg.subhead ??
            'Everything you need to get found, look professional, and book more clients — hands-free.'}
        </p>

        {/* Pricing card */}
        <div
          className="rounded-sm p-8 md:p-10 border"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(0,207,255,0.025), rgba(255,255,255,0.01))',
            boxShadow: `0 0 0 1px rgba(0,207,255,0.14), 0 8px 50px rgba(0,207,255,0.06)`,
          }}
        >
          {cfg.normalPriceLabel ? (
            <p className="text-sm text-white/40 mb-1">
              Normal price:{' '}
              <span className="line-through">{cfg.normalPriceLabel}</span>
            </p>
          ) : null}
          <p
            className="text-[10px] uppercase mb-3"
            style={{ color: CYAN, letterSpacing: '3px', fontFamily: BODY_FONT, fontWeight: 600 }}
          >
            Your price
          </p>
          <div className="flex items-baseline flex-wrap gap-x-3 mb-1">
            <span
              style={{
                color: CYAN,
                fontFamily: DISPLAY_FONT,
                fontSize: 56,
                letterSpacing: '1px',
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              {setupFmt}
            </span>
            <span className="text-sm text-white/60">today</span>
            <span className="text-2xl text-white/40 mx-2">+</span>
            <span
              className="text-white"
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 36,
                letterSpacing: '1px',
                fontWeight: 400,
              }}
            >
              {monthlyFmt}
            </span>
            <span className="text-sm text-white/60">/mo</span>
          </div>

          <ul className="mt-8 space-y-3 mb-10">
            {cfg.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-white/85 text-sm">
                <span
                  className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: CYAN }}
                />
                <span style={{ fontFamily: BODY_FONT, lineHeight: 1.55 }}>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={goToCheckout}
            disabled={submitting}
            aria-label="Start checkout"
            className="w-full py-4 px-6 rounded-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 text-black"
            style={{
              background: CYAN,
              fontFamily: BODY_FONT,
              fontWeight: 600,
              letterSpacing: '1.5px',
              fontSize: 14,
              textTransform: 'uppercase',
            }}
          >
            {submitting ? 'Loading…' : `Get Started — ${setupFmt} Today`}
          </button>

          {error ? (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-xs text-white/40 text-center">
            Secure checkout by Stripe. Cancel the monthly plan anytime.
          </p>
        </div>

        <p className="text-xs text-white/40 mt-12 text-center">
          Questions? Email{' '}
          <a href="mailto:ab@goelev8.ai" className="underline text-white/60 hover:text-white">
            ab@goelev8.ai
          </a>
        </p>
      </main>

      <footer className="relative z-10 text-center text-xs text-white/40 pb-10">
        &copy; 2026{' '}
        <a href="https://goelev8.ai" className="hover:text-white/70">
          GoElev8.ai
        </a>
      </footer>
    </div>
  );
}
