// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';
import type { OnboardingConfig } from '@/lib/onboarding-configs';

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

  const accent = cfg.accentColor;
  const setupFmt = `$${(cfg.setupFeeCents / 100).toFixed(0)}`;
  const monthlyFmt = `$${(cfg.monthlyPriceCents / 100).toFixed(0)}`;

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ ['--accent' as any]: accent }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <a href="/" className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/80 hover:text-white">
          <span className="font-bold" style={{ color: accent }}>GO</span>
          <span className="font-extralight">ELEV8.AI</span>
        </a>
        <a href="/" className="text-xs text-white/40 hover:text-white/70 uppercase tracking-widest">
          ← Home
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-24">
        <p
          className="text-xs uppercase tracking-[0.3em] mb-5"
          style={{ color: accent }}
        >
          For {cfg.businessName}
        </p>
        <h1 className="text-4xl md:text-5xl font-light leading-tight mb-6">
          {cfg.headline ?? 'Your digital presence, built for you.'}
        </h1>
        <p className="text-lg text-white/70 mb-12 max-w-2xl">
          {cfg.subhead ??
            'Everything you need to get found, look professional, and book more clients — hands-free.'}
        </p>

        {/* Pricing card */}
        <div
          className="rounded-lg p-8 md:p-10 border"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            boxShadow: `0 0 0 1px ${accent}1A, 0 12px 50px rgba(0,0,0,0.6)`,
          }}
        >
          {cfg.normalPriceLabel ? (
            <p className="text-sm text-white/40 mb-1">
              Normal price:{' '}
              <span className="line-through">{cfg.normalPriceLabel}</span>
            </p>
          ) : null}
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: accent }}>
            Your price
          </p>
          <div className="flex items-baseline flex-wrap gap-x-3 mb-2">
            <span className="text-4xl font-light" style={{ color: accent }}>
              {setupFmt}
            </span>
            <span className="text-sm text-white/60">today</span>
            <span className="text-2xl text-white/40 mx-2">+</span>
            <span className="text-2xl font-light text-white">{monthlyFmt}</span>
            <span className="text-sm text-white/60">/mo</span>
          </div>

          <ul className="mt-8 space-y-3 mb-10">
            {cfg.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-white/85 text-sm">
                <span
                  className="mt-1 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: accent }}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={goToCheckout}
            disabled={submitting}
            aria-label="Start checkout"
            className="w-full py-4 px-6 rounded font-medium text-black uppercase tracking-widest text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: accent }}
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

      <footer className="text-center text-xs text-white/40 pb-10">
        &copy; 2026{' '}
        <a href="https://goelev8.ai" className="hover:text-white/70">
          GoElev8.ai
        </a>
      </footer>
    </div>
  );
}
