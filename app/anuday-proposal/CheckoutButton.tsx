// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Client leaf component. One per Stripe checkout button on the proposal page.
// Kept as a small island so /anuday-proposal itself can stay a server
// component (metadata export etc.).
'use client';

import { useState } from 'react';

export type ProposalPlan =
  | 'bundle'
  | 'anuday-setup'
  | 'anuday-monthly'
  | 'freeflow-setup'
  | 'freeflow-monthly';

export default function CheckoutButton({
  plan,
  label,
  amountLabel,
  variant = 'primary',
}: {
  plan: ProposalPlan;
  label: string;
  amountLabel: string;
  variant?: 'primary' | 'secondary' | 'hero';
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
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
        className={`btn btn-${variant}`}
        aria-label={`Start checkout for ${plan}`}
      >
        {submitting ? 'Loading…' : label}
        {!submitting && <span className="amount">{amountLabel}</span>}
      </button>
      {error ? (
        <div className="btn-error" role="alert">
          {error}
        </div>
      ) : null}
    </>
  );
}
