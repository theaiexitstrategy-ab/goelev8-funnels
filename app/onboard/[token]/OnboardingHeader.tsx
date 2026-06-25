// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TOTAL_STEPS } from '@/lib/onboarding-steps';

export default function OnboardingHeader({
  token, accent, businessName,
}: {
  token: string; accent: string; businessName: string;
}) {
  const [savingSpot, setSavingSpot] = useState(false);
  const [spotMsg, setSpotMsg] = useState<string | null>(null);
  const pathname = usePathname();

  // Parse current step out of pathname /onboard/<token>/step/<n>
  const stepMatch = pathname?.match(/\/step\/(\d+)/);
  const currentStep = stepMatch ? Math.min(TOTAL_STEPS, Math.max(1, Number(stepMatch[1]))) : null;

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
    <header className="border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/80 hover:text-white">
          <span className="font-bold" style={{ color: accent }}>GO</span>
          <span className="font-extralight">ELEV8.AI</span>
        </a>
        <div className="text-xs uppercase tracking-widest text-white/40 truncate hidden md:block">
          {businessName}
        </div>
        <div className="flex items-center gap-4">
          {currentStep ? (
            <span className="text-xs uppercase tracking-widest text-white/50">
              Step <span className="text-white">{currentStep}</span> of {TOTAL_STEPS}
            </span>
          ) : null}
          <button
            type="button"
            onClick={saveSpot}
            disabled={savingSpot}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded px-3 py-1.5 disabled:opacity-50"
          >
            {savingSpot ? '…' : 'Save My Spot'}
          </button>
        </div>
      </div>
      {spotMsg ? (
        <div className="max-w-5xl mx-auto px-6 pb-3 text-xs text-white/60">{spotMsg}</div>
      ) : null}
    </header>
  );
}
