// lib/stripe.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripeInstance;
}

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: params.mode,
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    ...(params.mode === 'subscription' && params.trialDays
      ? {
          subscription_data: {
            trial_period_days: params.trialDays,
            trial_settings: { end_behavior: { missing_payment_method: 'pause' } },
            metadata: params.metadata,
          },
        }
      : {}),
  });
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function createCustomer(email: string, name: string, metadata?: Record<string, string>) {
  const stripe = getStripe();
  return stripe.customers.create({ email, name, metadata });
}
