// lib/security/webhooks.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Stripe from 'stripe';
import { createHmac } from 'crypto';

export function verifyStripeWebhook(payload: string, sig: string): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}

export function verifyTwilioWebhook(req: Request, params: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const url = req.url;

  // Build validation string: URL + sorted params
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const sig = req.headers.get('x-twilio-signature') || '';
  const expected = createHmac('sha1', authToken).update(data).digest('base64');
  return sig === expected;
}

export function verifyVapiWebhook(req: Request): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;
  const token = req.headers.get('x-vapi-secret') || '';
  return token === secret;
}
