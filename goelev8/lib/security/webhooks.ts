// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
import Stripe from 'stripe';
import twilio from 'twilio';
import { timingSafeEqual } from 'crypto';

export function verifyStripeWebhook(payload: string, sig: string): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  // Throws on invalid — catch in route, return 401
}

export function verifyTwilioWebhook(req: Request, params: Record<string,string>): boolean {
  const sig = req.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${new URL(req.url).pathname}`;
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, sig, url, params);
}

export function verifyVapiWebhook(req: Request): boolean {
  const sig = req.headers.get('x-vapi-secret') || '';
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(process.env.VAPI_WEBHOOK_SECRET!));
  } catch { return false; }
}
