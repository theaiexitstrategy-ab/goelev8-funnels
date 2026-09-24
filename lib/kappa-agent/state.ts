// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Demo state for the Kappa Chapter Agent. The browser owns this state and
// sends it with every request; the server validates it here, runs tools
// against it, and returns the updated copy. No database.

import { z } from 'zod';

const id = z.string().min(1).max(40);
const shortText = (max: number) => z.string().max(max);

export const BrotherSchema = z.object({
  id,
  name: shortText(60),
  phone: shortText(20),
  optIn: z.boolean(),
  dues: z.enum(['paid', 'unpaid']),
});

export const EventSchema = z.object({
  id,
  title: shortText(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^(\d{2}:\d{2})?$/),
  location: shortText(160),
  desc: shortText(600),
  vis: z.enum(['public', 'members']),
});

export const MessageSchema = z.object({
  id,
  dir: z.enum(['out', 'in']),
  brotherId: id,
  body: shortText(400),
  ts: z.number(),
  eventId: id.optional(),
  draftId: id.optional(),
  purpose: z.enum(['rsvp', 'reminder', 'dues', 'info']).optional(),
  auto: z.boolean().optional(),
  live: z.boolean().optional(),
  rsvp: z.enum(['yes', 'no']).optional(),
});

export const DraftSchema = z.object({
  id,
  body: shortText(400),
  recipientIds: z.array(id).max(100),
  skippedIds: z.array(id).max(100),
  eventId: id.optional(),
  purpose: z.enum(['rsvp', 'reminder', 'dues', 'info']),
  audience: shortText(40),
  status: z.enum(['pending', 'approved', 'sent', 'cancelled']),
  createdAt: z.number(),
});

export const PayLinkSchema = z.object({
  id,
  kind: z.enum(['dues', 'donation']),
  amount: z.number().nullable(),
  url: shortText(300),
  mode: z.enum(['stripe_test', 'simulated']),
  createdAt: z.number(),
});

export const PaymentSchema = z.object({
  id,
  brotherId: id.nullable(),
  kind: z.enum(['dues', 'donation']),
  amount: z.number(),
  ts: z.number(),
  via: shortText(40),
});

export const StateSchema = z.object({
  version: z.literal(1),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duesAmount: z.number().min(0).max(10000),
  brothers: z.array(BrotherSchema).max(60),
  events: z.array(EventSchema).max(60),
  rsvps: z.record(id, z.record(id, z.enum(['yes', 'no']))),
  messages: z.array(MessageSchema).max(1500),
  drafts: z.array(DraftSchema).max(100),
  links: z.array(PayLinkSchema).max(50),
  payments: z.array(PaymentSchema).max(300),
});

export type Brother = z.infer<typeof BrotherSchema>;
export type ChapterEvent = z.infer<typeof EventSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type PayLink = z.infer<typeof PayLinkSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type DemoState = z.infer<typeof StateSchema>;

export function newId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function describeDate(date: string): string {
  const d = parts(date);
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function describeTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function isUpcoming(state: DemoState, ev: ChapterEvent): boolean {
  return ev.date >= state.today;
}

/** Brothers who can be texted, who said yes/no, and who haven't replied. */
export function rsvpBreakdown(state: DemoState, eventId: string) {
  const answers = state.rsvps[eventId] ?? {};
  const yes: Brother[] = [];
  const no: Brother[] = [];
  const noReply: Brother[] = [];
  const notOptedIn: Brother[] = [];
  for (const b of state.brothers) {
    const a = answers[b.id];
    if (a === 'yes') yes.push(b);
    else if (a === 'no') no.push(b);
    else if (!b.optIn) notOptedIn.push(b);
    else noReply.push(b);
  }
  return { yes, no, noReply, notOptedIn };
}
