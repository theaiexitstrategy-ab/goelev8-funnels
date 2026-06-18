// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared message bodies and timing for the DEMO keyword 4-message sequence.
// Imported by both /api/demo-webhook (handles inbound DEMO / YES) and
// /api/cron/demo-sequence (drives the timer-based steps forward).

// Vercel Cron min interval is 1 minute, so these delays are approximate —
// real delivery can be ±60s from the intended time.
export const DELAY_TO_MSG_2_MS = 30 * 1000;
export const DELAY_TO_MSG_3_MS = 60 * 1000;
export const DELAY_TO_MSG_4_MS = 60 * 1000;

// Sequence is keyword-driven only now (DEMO → YES → READY → GO). The cron
// path stays in place but stops firing because the inbound handler no longer
// stamps next_msg_due_at on new sessions.
//
// The Founding Client Payment Link URL is embedded inline in MSG 4. Override
// via STRIPE_FOUNDING_PAYMENT_LINK env var when regenerating the link.
export const FOUNDING_PAYMENT_LINK = 'https://buy.stripe.com/00w8wP86w5f8cBP08P8IU01';

export const DEMO_MSG = {
  one:
    `👋🏾 You just triggered GoElev8.ai's automated follow-up system — and this is exactly what your leads experience the second they reach out to your business.

Reply YES to see what happens next.

Reply STOP to opt out.`,

  two:
    `🔥 Here's what just happened in the last 60 seconds:

✅ You sent a keyword
✅ Our system captured it instantly
✅ An automated reply went out
✅ You're now in a follow-up sequence

Your leads get this experience. Your competitors are still texting manually.

Reply READY and we'll show you exactly how to get this running for your business.

Reply STOP to opt out.`,

  three:
    `🚀 Real results from real clients:

- The Flex Facility went from missed leads to automated follow-ups running 24/7
- iSlay Studios onboarded new members without lifting a finger
- Will Power Fitness converted cold leads while the owner was training

This isn't software. It's your business running on autopilot.

Reply GO and we'll get yours live in 48 hours.

Reply STOP to opt out.`,

  four: (paymentUrl: string) =>
    `💪🏾 Let's build yours.

Founding Client Rate — today only:
✅ $400 setup
✅ $99/mo — 50% off regular monthly rate
✅ SMS, AI voice, CRM, booking automation, all of it
✅ Live in 48 hours

Claim your spot:
${paymentUrl}

This rate locks in permanently as long as you stay active. Spots are limited.

Reply STOP to opt out.`,
};
