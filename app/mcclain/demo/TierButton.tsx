// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Small client component that renders a "Get started" button and starts
// the Stripe Checkout Session for the given tier. Kept as a leaf
// component so the /mcclain/demo page can stay a server component (metadata
// export etc.) and only this island hydrates on the client.
'use client';

import { useState } from 'react';
import type { McclainTierKey } from '@/lib/mcclain-tiers';

export default function TierButton({
  tier,
  label,
  variant = 'primary',
}: {
  tier: McclainTierKey;
  label?: string;
  variant?: 'primary' | 'ghost';
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/mcclain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
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
    <>
      <button
        type="button"
        onClick={startCheckout}
        disabled={submitting}
        className={`btn btn-${variant} tier-btn`}
        aria-label={`Start checkout for the ${tier} tier`}
      >
        {submitting ? 'Loading…' : label ?? 'Get started'}
      </button>
      {error ? (
        <p className="tier-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
