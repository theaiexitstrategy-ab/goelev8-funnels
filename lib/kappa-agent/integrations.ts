// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Stripe (test mode only) and Twilio (allow-listed test numbers only) for the
// Kappa Chapter Agent demo. Both are optional; without them the demo simulates.

import Stripe from 'stripe';

// ── Stripe ────────────────────────────────────────────────────────────────
// KAPPA_DEMO_STRIPE_KEY is preferred so the shared STRIPE_SECRET_KEY (which
// runs real checkout) never has to change. Either way, only sk_test_ keys are
// ever used — a live key means "simulate".
export function stripeTestKey(): string | null {
  for (const key of [process.env.KAPPA_DEMO_STRIPE_KEY, process.env.STRIPE_SECRET_KEY]) {
    if (key && key.startsWith('sk_test_')) return key;
  }
  return null;
}

export async function createStripeTestLink(opts: {
  kind: 'dues' | 'donation';
  amountUsd: number | null;
  label: string;
}): Promise<string> {
  const key = stripeTestKey();
  if (!key) throw new Error('No Stripe test key configured');
  const stripe = new Stripe(key);
  const product = await stripe.products.create({
    name: opts.label,
    metadata: { source: 'kappa-agent-demo', kind: opts.kind },
  });
  const price = await stripe.prices.create(
    opts.amountUsd != null
      ? { product: product.id, currency: 'usd', unit_amount: Math.round(opts.amountUsd * 100) }
      : { product: product.id, currency: 'usd', custom_unit_amount: { enabled: true, minimum: 500 } },
  );
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { source: 'kappa-agent-demo', kind: opts.kind },
  });
  return link.url;
}

// ── Twilio live test text ─────────────────────────────────────────────────
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

/**
 * The only numbers the demo may ever text for real: KAPPA_DEMO_TEST_NUMBERS
 * plus the master admin's own cell (AARON_PERSONAL_CELL, already set in Vercel).
 */
export function liveTestNumbers(): string[] {
  const raw = [process.env.KAPPA_DEMO_TEST_NUMBERS, process.env.AARON_PERSONAL_CELL].filter(Boolean).join(',');
  const out = new Set<string>();
  for (const part of raw.split(',')) {
    const n = normalizePhone(part.trim());
    if (n) out.add(n);
  }
  return Array.from(out).slice(0, 5);
}

function twilioFrom(): string {
  return process.env.TWILIO_TOLL_FREE || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MASTER_NUMBER || '';
}

export function liveTextAvailable(): boolean {
  return (
    liveTestNumbers().length > 0 &&
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!twilioFrom()
  );
}

export function maskPhone(e164: string): string {
  return '•••-' + e164.slice(-4);
}

/** Sends one message to each allow-listed test number. Returns how many went out. */
export async function sendLiveTestText(body: string): Promise<{ sent: number; failed: number }> {
  if (!liveTextAvailable()) return { sent: 0, failed: 0 };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = twilioFrom();
  let sent = 0;
  let failed = 0;
  for (const to of liveTestNumbers()) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });
      if (res.ok) sent++;
      else {
        failed++;
        console.error('[kappa-agent] Twilio error', res.status, await res.text());
      }
    } catch (err) {
      failed++;
      console.error('[kappa-agent] Twilio fetch error', err);
    }
  }
  return { sent, failed };
}
