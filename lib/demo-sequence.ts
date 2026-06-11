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

export const DEMO_MSG = {
  one:
    `👋 Hey! Thanks for reaching out to GoElev8.ai — imagine this demo being for your business. We just got your message and we're already on it. This is your automated follow-up. Reply YES to learn more about getting started.`,
  two:
    `💡 Quick note — you just experienced GoElev8.ai in action. That instant response? That was automation. Your real leads get this same experience 24/7, even when you're coaching, sleeping, or off the floor. No manual work. No leads slipping through.`,
  three:
    `📊 Real results from The Flex Facility STL — 30 days on GoElev8:\n- 550 page views\n- 27 leads captured automatically\n- 6 converted to paying members (22% close rate)\nZero manual follow-up. The system did it all.`,
  four:
    `🚀 Want to see what this looks like for YOUR business? Book a free 15-min call with Aaron at GoElev8.ai — he'll show you the live dashboard and walk you through exactly how it works.\n👉 Book.goelev8.ai/go`,
};
