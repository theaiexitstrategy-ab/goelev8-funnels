// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Carrier-compliance helpers for inbound SMS handling and outbound suppression.
//
//   detectComplianceIntent — does the inbound text match STOP / START / HELP?
//   isOptedOut            — has this phone been added to the global suppression list?
//   markOptedOut          — record a STOP (idempotent upsert)
//   clearOptOut           — remove from list on START
//   withOptOutNotice      — append "Reply STOP to opt out" to an outbound body
//
// All outbound SMS sends in the app should pass through isOptedOut() before
// hitting Twilio, regardless of which number or flow originated the send.

import type { SupabaseClient } from '@supabase/supabase-js';

// CTIA-recognized opt-out keywords. Carriers honor these without app-level
// support, but we honor them in code too so our suppression list stays in sync.
const STOP_KEYWORDS = new Set([
  'stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'opt-out', 'optout',
]);
const START_KEYWORDS = new Set([
  'start', 'unstop', 'subscribe', 'resubscribe',
]);
const HELP_KEYWORDS = new Set([
  'help', 'info',
]);

export type ComplianceIntent = 'stop' | 'start' | 'help' | null;

// Match if the FIRST token of a short (<=3-word) message is a compliance
// keyword. "STOP", "STOP please", "stop now" → stop. "Mom" → null.
export function detectComplianceIntent(text: string): ComplianceIntent {
  if (!text) return null;
  const tokens = text.trim().toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0 || tokens.length > 3) return null;

  const first = tokens[0];
  if (STOP_KEYWORDS.has(first)) return 'stop';
  if (START_KEYWORDS.has(first)) return 'start';
  if (HELP_KEYWORDS.has(first)) return 'help';
  return null;
}

export async function isOptedOut(supabase: SupabaseClient, phone: string): Promise<boolean> {
  if (!phone) return false;
  const { data } = await supabase
    .from('sms_opt_outs')
    .select('phone')
    .eq('phone', phone)
    .maybeSingle();
  return !!data;
}

export async function markOptedOut(
  supabase: SupabaseClient,
  phone: string,
  source: string,
  messageReceived: string,
): Promise<void> {
  await supabase.from('sms_opt_outs').upsert(
    { phone, source, message_received: messageReceived, opted_out_at: new Date().toISOString() },
    { onConflict: 'phone' },
  );
}

export async function clearOptOut(supabase: SupabaseClient, phone: string): Promise<void> {
  await supabase.from('sms_opt_outs').delete().eq('phone', phone);
}

// Bulk-check a list of phones for opt-outs in one query.
export async function getOptedOutSet(supabase: SupabaseClient, phones: string[]): Promise<Set<string>> {
  if (phones.length === 0) return new Set();
  const { data } = await supabase
    .from('sms_opt_outs')
    .select('phone')
    .in('phone', phones);
  return new Set((data ?? []).map((r) => r.phone as string));
}

const OPT_OUT_NOTICE = 'Reply STOP to opt out.';

// Append the opt-out reminder to outbound bodies that don't already include it.
export function withOptOutNotice(message: string): string {
  if (/reply\s+stop/i.test(message)) return message;
  return `${message}\n\n${OPT_OUT_NOTICE}`;
}

// Stock compliance replies.
export const STOP_CONFIRMATION =
  'You have been unsubscribed from GoElev8.ai. You will not receive any more texts. Reply START to re-subscribe.';
export const START_CONFIRMATION =
  'You are re-subscribed to GoElev8.ai. Reply STOP at any time to opt out.';
export const HELP_RESPONSE =
  'GoElev8.ai — AI follow-up assistant. Support: support@goelev8.ai. Msg & data rates may apply. Reply STOP to opt out.';
