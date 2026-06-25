// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TOTAL_STEPS } from '@/lib/onboarding-steps';

const CYAN = '#00CFFF';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';

export default function OnboardingHeader({
  token, businessName,
}: {
  token: string; businessName: string;
}) {
  const [savingSpot, setSavingSpot] = useState(false);
  const [spotMsg, setSpotMsg] = useState<string | null>(null);
  const pathname = usePathname();

  const stepMatch = pathname?.match(/\/step\/(\d+)/);
  const currentStep = stepMatch
    ? Math.min(TOTAL_STEPS, Math.max(1, Number(stepMatch[1])))
    : null;

  async function saveSpot() {
    setSavingSpot(true);
    setSpotMsg(null);
    try {
      const res = await fetch('/api/onboard/save-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) setSpotMsg('Resume link sent to your email.');
      else setSpotMsg(data.error || 'Could not send resume link.');
    } catch {
      setSpotMsg('Network error.');
    } finally {
      setSavingSpot(false);
    }
  }

  return (
    <header className="border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <a href="/" className="inline-flex items-center" aria-label="GoElev8.ai home">
          <img
            src="/images/goelev8-full-logo.png"
            alt="GoElev8.ai — Infinite Possibilities"
            width={48}
            height={48}
            style={{ display: 'block' }}
          />
        </a>
        <div
          className="hidden md:block text-[11px] uppercase truncate text-white/40"
          style={{ letterSpacing: '2px', fontFamily: BODY_FONT }}
        >
          {businessName}
        </div>
        <div className="flex items-center gap-4">
          {currentStep ? (
            <span
              className="text-[11px] uppercase text-white/50"
              style={{ letterSpacing: '2.5px', fontFamily: BODY_FONT }}
            >
              Step <span style={{ color: CYAN }}>{currentStep}</span> of {TOTAL_STEPS}
            </span>
          ) : null}
          <button
            type="button"
            onClick={saveSpot}
            disabled={savingSpot}
            className="text-[11px] uppercase border rounded-sm px-3 py-1.5 disabled:opacity-50 transition"
            style={{
              letterSpacing: '2px',
              fontFamily: BODY_FONT,
              borderColor: 'rgba(0,207,255,0.35)',
              color: 'rgba(255,255,255,0.85)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = CYAN;
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,207,255,0.35)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
            }}
          >
            {savingSpot ? '…' : 'Save My Spot'}
          </button>
        </div>
      </div>
      {spotMsg ? (
        <div className="max-w-5xl mx-auto px-6 pb-3 text-xs" style={{ color: CYAN }}>
          {spotMsg}
        </div>
      ) : null}
    </header>
  );
}
