// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Tools for the Kappa Chapter Agent demo. Each tool reads or mutates the
// browser-supplied DemoState. Guardrails that matter (approval before group
// texts, SMS format, opt-outs) are enforced here in code, not just in the
// system prompt.

import type Anthropic from '@anthropic-ai/sdk';
import {
  type Brother,
  type DemoState,
  type Draft,
  describeDate,
  describeTime,
  isUpcoming,
  newId,
  rsvpBreakdown,
} from './state';
import { createStripeTestLink, stripeTestKey } from './integrations';

export const SMS_PREFIX = 'Kappa Lawton:';
export const SMS_MAX = 160; // bodies must be strictly under this

export class ToolError extends Error {}

export type SentInfo = {
  messageId: string;
  brotherId: string;
  eventId?: string;
  purpose: 'rsvp' | 'reminder' | 'dues' | 'info';
  draftId?: string;
};

export type ToolContext = {
  state: DemoState;
  mode: 'chat' | 'inbound';
  sent: SentInfo[];
  newDraftIds: string[];
  focusEventId?: string;
  /** Inbound auto-replies may only text the brother who wrote in. */
  onlyBrotherId?: string;
};

export function checkSms(body: string): string | null {
  const b = body.trim();
  if (!b.startsWith(SMS_PREFIX)) return `Every text must start with "${SMS_PREFIX}".`;
  if (b.length >= SMS_MAX) return `This text is ${b.length} characters. It must be under ${SMS_MAX}, including any link. Shorten it and try again.`;
  return null;
}

// ── helpers ───────────────────────────────────────────────────────────────
function str(input: Record<string, unknown>, key: string, required = false): string | undefined {
  const v = input[key];
  if (v == null || v === '') {
    if (required) throw new ToolError(`Missing required field "${key}".`);
    return undefined;
  }
  if (typeof v !== 'string') throw new ToolError(`"${key}" must be a string.`);
  return v.trim();
}

function findEvent(ctx: ToolContext, eventId: string | undefined) {
  const ev = ctx.state.events.find((e) => e.id === eventId);
  if (!ev) throw new ToolError(`No event with id "${eventId}". Call list_events to get valid ids.`);
  ctx.focusEventId = ev.id;
  return ev;
}

function findBrother(ctx: ToolContext, brotherId: string | undefined): Brother {
  const b = ctx.state.brothers.find((x) => x.id === brotherId);
  if (!b) throw new ToolError(`No brother with id "${brotherId}". Call list_brothers to get valid ids.`);
  return b;
}

function eventView(state: DemoState, e: DemoState['events'][number]) {
  const r = rsvpBreakdown(state, e.id);
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    when: `${describeDate(e.date)}${e.time ? ' at ' + describeTime(e.time) : ''}`,
    location: e.location,
    description: e.desc,
    shown_to: e.vis === 'public' ? 'everyone' : 'brothers only',
    rsvp_counts: { yes: r.yes.length, no: r.no.length, no_reply: r.noReply.length, not_opted_in: r.notOptedIn.length },
  };
}

const names = (list: Brother[]) => list.map((b) => b.name);

function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) {
    throw new ToolError('date must be YYYY-MM-DD.');
  }
}
function validTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ToolError('time must be 24-hour HH:MM, e.g. 09:00 or 19:30.');
}

function pushOutbound(ctx: ToolContext, b: Brother, body: string, extra: Omit<SentInfo, 'messageId' | 'brotherId'>) {
  const id = newId('m');
  ctx.state.messages.push({ id, dir: 'out', brotherId: b.id, body, ts: Date.now(), ...extra, auto: ctx.mode === 'inbound' || undefined });
  ctx.sent.push({ messageId: id, brotherId: b.id, ...extra });
}

// ── tool definitions ──────────────────────────────────────────────────────
const obj = (properties: Record<string, unknown>, required: string[] = []) =>
  ({ type: 'object' as const, properties, required, additionalProperties: false });

const eventId = { type: 'string', description: 'Event id from list_events, e.g. "e1".' };
const brotherId = { type: 'string', description: 'Brother id from list_brothers, e.g. "b7".' };

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_events',
    description: 'List chapter events with date, time, place, who can see them, and RSVP counts. Upcoming events only unless include_past is true.',
    input_schema: obj({ include_past: { type: 'boolean' } }),
  },
  {
    name: 'create_event',
    description: 'Add a chapter event. It appears on the chapter site right away. Does not text anyone.',
    input_schema: obj(
      {
        title: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: '24-hour HH:MM, e.g. 09:00' },
        location: { type: 'string' },
        description: { type: 'string' },
        visibility: { type: 'string', enum: ['public', 'members'], description: 'public = everyone, members = brothers only. Default public.' },
      },
      ['title', 'date', 'time', 'location'],
    ),
  },
  {
    name: 'update_event',
    description: 'Change details of an existing event. Only fields you pass are changed. Does not text anyone.',
    input_schema: obj(
      {
        event_id: eventId,
        title: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: '24-hour HH:MM' },
        location: { type: 'string' },
        description: { type: 'string' },
        visibility: { type: 'string', enum: ['public', 'members'] },
      },
      ['event_id'],
    ),
  },
  {
    name: 'get_rsvp_summary',
    description: 'Exactly who said yes, who said no, who has not replied, and who cannot be texted (not opted in) for one event.',
    input_schema: obj({ event_id: eventId }, ['event_id']),
  },
  {
    name: 'list_brothers',
    description: 'List brothers with id, name, phone, text opt-in status, and dues status. Filter and/or search by name.',
    input_schema: obj({
      filter: { type: 'string', enum: ['all', 'unpaid_dues', 'paid_dues', 'not_opted_in'] },
      search: { type: 'string', description: 'Case-insensitive name match, e.g. "Carter".' },
    }),
  },
  {
    name: 'draft_group_text',
    description:
      'Draft a text to a group of brothers. Nothing is sent. Resolves the audience, removes brothers who have not opted in (reported back as skipped), and shows the admin a draft card with Approve and Edit buttons. After calling this, stop and ask the admin to approve.',
    input_schema: obj(
      {
        body: { type: 'string', description: 'The SMS. Must start with "Kappa Lawton:" and be under 160 characters including any link.' },
        audience: {
          type: 'string',
          enum: ['all', 'no_reply', 'yes_rsvps', 'unpaid_dues', 'brother_ids'],
          description: 'all = every brother; no_reply = no answer yet for event_id; yes_rsvps = said yes to event_id; unpaid_dues; brother_ids = the ids you list.',
        },
        purpose: { type: 'string', enum: ['rsvp', 'reminder', 'dues', 'info'], description: 'rsvp = asking YES/NO; reminder = follow-up or day-before reminder; dues = payment request; info = announcement.' },
        event_id: { ...eventId, description: 'Required for no_reply and yes_rsvps, and for rsvp/reminder texts.' },
        brother_ids: { type: 'array', items: { type: 'string' } },
      },
      ['body', 'audience', 'purpose'],
    ),
  },
  {
    name: 'send_group_text',
    description: 'Send a group-text draft. Refuses unless the admin has approved that exact draft. Never call this in the same turn you created the draft.',
    input_schema: obj({ draft_id: { type: 'string' } }, ['draft_id']),
  },
  {
    name: 'send_individual_text',
    description: 'Text one brother right away. Must start with "Kappa Lawton:" and be under 160 characters. Fails for brothers who have not opted in.',
    input_schema: obj(
      {
        brother_id: brotherId,
        body: { type: 'string' },
        event_id: { ...eventId, description: 'Optional: the event this text is about.' },
      },
      ['brother_id', 'body'],
    ),
  },
  {
    name: 'record_rsvp',
    description: "Record a brother's YES or NO for an event.",
    input_schema: obj(
      { event_id: eventId, brother_id: brotherId, response: { type: 'string', enum: ['yes', 'no'] } },
      ['event_id', 'brother_id', 'response'],
    ),
  },
  {
    name: 'create_payment_link',
    description:
      'Get a payment link to include in a text. dues uses the chapter dues amount unless amount_usd is given; donation with no amount lets the payer choose. Reuses an existing link for the same kind and amount.',
    input_schema: obj(
      {
        kind: { type: 'string', enum: ['dues', 'donation'] },
        amount_usd: { type: 'number' },
      },
      ['kind'],
    ),
  },
  {
    name: 'list_payments',
    description: 'Dues status (who has paid, who has not), totals collected, recent payments, and existing payment links.',
    input_schema: obj({}),
  },
];

export const INBOUND_TOOL_NAMES = new Set(['list_events', 'get_rsvp_summary', 'send_individual_text', 'record_rsvp', 'list_payments', 'create_payment_link']);

// ── executors ─────────────────────────────────────────────────────────────
type Exec = (ctx: ToolContext, input: Record<string, unknown>) => Promise<unknown> | unknown;

const EXECUTORS: Record<string, Exec> = {
  list_events(ctx, input) {
    const { state } = ctx;
    const events = state.events
      .filter((e) => input.include_past === true || isUpcoming(state, e))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return { today: describeDate(state.today), events: events.map((e) => eventView(state, e)) };
  },

  create_event(ctx, input) {
    const title = str(input, 'title', true)!;
    const date = str(input, 'date', true)!;
    const time = str(input, 'time', true)!;
    const location = str(input, 'location', true)!;
    validDate(date);
    validTime(time);
    if (date < ctx.state.today) throw new ToolError(`${date} is in the past (today is ${ctx.state.today}).`);
    const existing = ctx.state.events.find((e) => e.title.toLowerCase() === title.toLowerCase() && e.date === date);
    if (existing) {
      ctx.focusEventId = existing.id;
      return { note: 'An event with this title and date already exists; no duplicate created.', event: eventView(ctx.state, existing) };
    }
    const vis = input.visibility === 'members' ? 'members' : 'public';
    const ev = { id: newId('e'), title, date, time, location, desc: str(input, 'description') ?? '', vis } as const;
    ctx.state.events.push({ ...ev });
    ctx.state.rsvps[ev.id] = {};
    ctx.focusEventId = ev.id;
    return { created: eventView(ctx.state, ev) };
  },

  update_event(ctx, input) {
    const ev = findEvent(ctx, str(input, 'event_id', true));
    const changed: string[] = [];
    const title = str(input, 'title');
    const date = str(input, 'date');
    const time = str(input, 'time');
    const location = str(input, 'location');
    const description = str(input, 'description');
    if (title) { ev.title = title; changed.push('title'); }
    if (date) { validDate(date); ev.date = date; changed.push('date'); }
    if (time) { validTime(time); ev.time = time; changed.push('time'); }
    if (location) { ev.location = location; changed.push('location'); }
    if (description != null) { ev.desc = description; changed.push('description'); }
    if (input.visibility === 'public' || input.visibility === 'members') { ev.vis = input.visibility; changed.push('visibility'); }
    if (!changed.length) throw new ToolError('Nothing to change. Pass at least one field.');
    return { updated: eventView(ctx.state, ev), changed, note: 'Brothers have not been notified of this change.' };
  },

  get_rsvp_summary(ctx, input) {
    const ev = findEvent(ctx, str(input, 'event_id', true));
    const r = rsvpBreakdown(ctx.state, ev.id);
    return {
      event: eventView(ctx.state, ev),
      yes: names(r.yes),
      no: names(r.no),
      no_reply: names(r.noReply),
      not_opted_in_cannot_text: names(r.notOptedIn),
    };
  },

  list_brothers(ctx, input) {
    const search = (str(input, 'search') ?? '').toLowerCase();
    const filter = input.filter ?? 'all';
    const list = ctx.state.brothers.filter((b) => {
      if (filter === 'unpaid_dues' && b.dues !== 'unpaid') return false;
      if (filter === 'paid_dues' && b.dues !== 'paid') return false;
      if (filter === 'not_opted_in' && b.optIn) return false;
      return !search || b.name.toLowerCase().includes(search);
    });
    return {
      count: list.length,
      brothers: list.map((b) => ({ id: b.id, name: b.name, phone: b.phone, opted_in_to_texts: b.optIn, dues: b.dues })),
    };
  },

  draft_group_text(ctx, input) {
    if (ctx.mode !== 'chat') throw new ToolError('Group texts can only be drafted by the admin.');
    const body = str(input, 'body', true)!;
    const problem = checkSms(body);
    if (problem) throw new ToolError(problem);
    const audience = String(input.audience ?? '');
    const purpose = ['rsvp', 'reminder', 'dues', 'info'].includes(String(input.purpose)) ? (input.purpose as Draft['purpose']) : 'info';
    const evId = str(input, 'event_id');
    const ev = evId ? findEvent(ctx, evId) : undefined;
    if ((purpose === 'rsvp' || purpose === 'reminder' || audience === 'no_reply' || audience === 'yes_rsvps') && !ev) {
      throw new ToolError('event_id is required for this audience/purpose.');
    }
    const { state } = ctx;
    let pool: Brother[];
    if (audience === 'all') pool = state.brothers;
    else if (audience === 'unpaid_dues') pool = state.brothers.filter((b) => b.dues === 'unpaid');
    else if (audience === 'no_reply') pool = state.brothers.filter((b) => !state.rsvps[ev!.id]?.[b.id]);
    else if (audience === 'yes_rsvps') pool = state.brothers.filter((b) => state.rsvps[ev!.id]?.[b.id] === 'yes');
    else if (audience === 'brother_ids') {
      const ids = Array.isArray(input.brother_ids) ? input.brother_ids.map(String) : [];
      pool = ids.map((i) => findBrother(ctx, i));
    } else throw new ToolError('Unknown audience.');
    const recipients = pool.filter((b) => b.optIn);
    const skipped = pool.filter((b) => !b.optIn);
    if (!recipients.length) throw new ToolError('Nobody in that audience can be texted.');
    // One active draft at a time keeps approval unambiguous.
    for (const d of state.drafts) if (d.status === 'pending' || d.status === 'approved') d.status = 'cancelled';
    const draft: Draft = {
      id: newId('d'),
      body: body.trim(),
      recipientIds: recipients.map((b) => b.id),
      skippedIds: skipped.map((b) => b.id),
      eventId: ev?.id,
      purpose,
      audience,
      status: 'pending',
      createdAt: Date.now(),
    };
    state.drafts.push(draft);
    ctx.newDraftIds.push(draft.id);
    return {
      draft_id: draft.id,
      status: 'waiting for admin approval — do not send yet',
      characters: draft.body.length,
      recipient_count: recipients.length,
      recipients: names(recipients),
      skipped_not_opted_in: names(skipped),
    };
  },

  send_group_text(ctx, input) {
    const draft = ctx.state.drafts.find((d) => d.id === str(input, 'draft_id', true));
    if (!draft) throw new ToolError('No draft with that id.');
    if (draft.status === 'sent') throw new ToolError('That draft was already sent.');
    if (draft.status !== 'approved') {
      throw new ToolError('This draft has not been approved. Ask the admin to press Approve on the draft card (or reply "send it"), then wait.');
    }
    const problem = checkSms(draft.body);
    if (problem) throw new ToolError(problem);
    const answered = draft.eventId ? ctx.state.rsvps[draft.eventId] ?? {} : {};
    const recipients = draft.recipientIds
      .map((i) => ctx.state.brothers.find((b) => b.id === i))
      .filter((b): b is Brother => !!b && b.optIn)
      // A no-reply follow-up skips anyone who answered after it was drafted.
      .filter((b) => draft.audience !== 'no_reply' || !answered[b.id]);
    if (!recipients.length) throw new ToolError('Everyone on this draft has already replied, so there is no one left to text.');
    for (const b of recipients) pushOutbound(ctx, b, draft.body, { eventId: draft.eventId, purpose: draft.purpose, draftId: draft.id });
    draft.status = 'sent';
    if (draft.eventId) ctx.focusEventId = draft.eventId;
    const skipped = draft.skippedIds.map((i) => ctx.state.brothers.find((b) => b.id === i)?.name).filter(Boolean);
    return { sent_to: recipients.length, skipped_not_opted_in: skipped, note: 'Replies will arrive over the next minute; RSVPs are recorded automatically.' };
  },

  send_individual_text(ctx, input) {
    const b = findBrother(ctx, str(input, 'brother_id', true));
    if (ctx.onlyBrotherId && b.id !== ctx.onlyBrotherId) throw new ToolError('Auto-replies can only go to the brother who texted in.');
    if (!b.optIn) throw new ToolError(`${b.name} has not opted in to texts, so they can't be texted.`);
    const body = str(input, 'body', true)!;
    const problem = checkSms(body);
    if (problem) throw new ToolError(problem);
    const evId = str(input, 'event_id');
    if (evId) findEvent(ctx, evId);
    pushOutbound(ctx, b, body, { eventId: evId, purpose: 'info' });
    return { sent_to: b.name, characters: body.length };
  },

  record_rsvp(ctx, input) {
    const ev = findEvent(ctx, str(input, 'event_id', true));
    const b = findBrother(ctx, str(input, 'brother_id', true));
    const response = input.response === 'no' ? 'no' : input.response === 'yes' ? 'yes' : null;
    if (!response) throw new ToolError('response must be "yes" or "no".');
    (ctx.state.rsvps[ev.id] ??= {})[b.id] = response;
    return { recorded: `${b.name}: ${response.toUpperCase()} for ${ev.title}` };
  },

  async create_payment_link(ctx, input) {
    const kind = input.kind === 'donation' ? 'donation' : 'dues';
    const amount =
      typeof input.amount_usd === 'number' && input.amount_usd > 0
        ? Math.round(input.amount_usd * 100) / 100
        : kind === 'dues'
          ? ctx.state.duesAmount
          : null;
    if (amount != null && amount > 5000) throw new ToolError('Amounts over $5,000 need the admin.');
    const mode = stripeTestKey() ? 'stripe_test' : 'simulated';
    const existing = ctx.state.links.find((l) => l.kind === kind && l.amount === amount && l.mode === mode);
    if (existing) return { url: existing.url, kind, amount_usd: amount, mode, reused: true };
    let url: string;
    let usedMode: 'stripe_test' | 'simulated' = mode;
    try {
      if (mode !== 'stripe_test') throw new Error('simulate');
      url = await createStripeTestLink({
        kind,
        amountUsd: amount,
        label: kind === 'dues' ? `Lawton Chapter dues (demo)` : `Lawton Chapter donation (demo)`,
      });
    } catch (err) {
      if (mode === 'stripe_test') console.error('[kappa-agent] Stripe test link failed, simulating', err);
      usedMode = 'simulated';
      url = `https://goelev8.ai/kappa/pay/${kind}-${Math.random().toString(36).slice(2, 6)}`;
    }
    ctx.state.links.push({ id: newId('l'), kind, amount, url, mode: usedMode, createdAt: Date.now() });
    return { url, kind, amount_usd: amount, mode: usedMode };
  },

  list_payments(ctx) {
    const { state } = ctx;
    const paid = state.brothers.filter((b) => b.dues === 'paid');
    const unpaid = state.brothers.filter((b) => b.dues === 'unpaid');
    const sum = (k: 'dues' | 'donation') => state.payments.filter((p) => p.kind === k).reduce((a, p) => a + p.amount, 0);
    return {
      dues_amount_usd: state.duesAmount,
      dues_paid: { count: paid.length, names: names(paid) },
      dues_unpaid: { count: unpaid.length, brothers: unpaid.map((b) => ({ id: b.id, name: b.name, opted_in_to_texts: b.optIn })) },
      collected_usd: { dues: sum('dues'), donations: sum('donation') },
      recent_payments: state.payments.slice(-8).map((p) => ({
        from: state.brothers.find((b) => b.id === p.brotherId)?.name ?? 'Guest',
        kind: p.kind,
        amount_usd: p.amount,
      })),
      links: state.links.map((l) => ({ kind: l.kind, amount_usd: l.amount, url: l.url, mode: l.mode })),
      note: 'Refunds and dues-amount changes are handled by the admin, not the agent.',
    };
  },
};

export async function runTool(ctx: ToolContext, name: string, input: unknown): Promise<{ content: string; isError: boolean }> {
  const exec = EXECUTORS[name];
  if (!exec || (ctx.mode === 'inbound' && !INBOUND_TOOL_NAMES.has(name))) {
    return { content: `Tool "${name}" is not available.`, isError: true };
  }
  try {
    const result = await exec(ctx, (input && typeof input === 'object' ? input : {}) as Record<string, unknown>);
    return { content: JSON.stringify(result), isError: false };
  } catch (err) {
    if (err instanceof ToolError) return { content: err.message, isError: true };
    console.error('[kappa-agent] tool crashed', name, err);
    return { content: 'The tool failed unexpectedly. Tell the admin you will pass this along.', isError: true };
  }
}
