'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createKeyword } from './actions';

type EventOption = { id: string; title: string; event_date: string };

const TIERS: { value: 'vip' | 'general' | 'new'; label: string; help: string }[] = [
  { value: 'vip', label: 'VIP', help: 'Premium access, table, fast lane' },
  { value: 'general', label: 'General', help: 'Standard ticket' },
  { value: 'new', label: 'New', help: 'First-time guest discount' },
];

export default function KeywordForm({
  events,
  keywordPrefix,
}: {
  events: EventOption[];
  keywordPrefix: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [tier, setTier] = useState<'vip' | 'general' | 'new'>('general');
  const [keyword, setKeyword] = useState(keywordPrefix);
  const [eventId, setEventId] = useState(events[0]?.id ?? '');

  const onSubmit = (formData: FormData) => {
    setError('');
    formData.set('keyword', keyword.toUpperCase());
    formData.set('tier', tier);
    formData.set('event_id', eventId);
    startTransition(async () => {
      const result = await createKeyword(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6 pb-8">
      <div className="mb-2 flex items-center gap-2">
        <Link
          href="/hush/app/messages"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-hush-muted2 transition-colors hover:text-hush-gold"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
          NEW KEYWORD
        </p>
      </div>

      <h1 className="bg-hush-gold-text-mid text-fill-transparent animate-fade-up font-bebas text-[36px] leading-tight tracking-wide">
        Auto-reply.
      </h1>
      <p
        className="mb-6 mt-2 animate-fade-up font-cormorant text-[14px] italic text-hush-muted2"
        style={{ animationDelay: '0.1s' }}
      >
        Guests text this keyword. AI replies with your message and link.
      </p>

      <form
        action={onSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.2s' }}
      >
        <div>
          <label
            htmlFor="event_id"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Event
          </label>
          <select
            id="event_id"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full appearance-none rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors focus:border-hush-gold"
            style={{ colorScheme: 'dark' }}
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} — {new Date(evt.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="keyword"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Keyword
          </label>
          <input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="HUSHVIP"
            maxLength={20}
            required
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-bebas text-[18px] tracking-[0.18em] text-hush-white outline-none transition-colors focus:border-hush-gold"
          />
          <p className="mt-1.5 font-outfit text-[10px] leading-snug text-hush-muted">
            Letters &amp; numbers only. Suggested prefix: <span className="text-hush-gold">{keywordPrefix}</span>
          </p>
        </div>

        <div>
          <p className="mb-1.5 font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted">
            Tier
          </p>
          <div className="flex flex-col gap-2">
            {TIERS.map((opt) => {
              const isSelected = tier === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTier(opt.value)}
                  className={`flex w-full items-center justify-between rounded-md border bg-hush-card px-3.5 py-2.5 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-hush-gold bg-hush-gdim'
                      : 'border-hush-gline hover:border-hush-gold'
                  }`}
                >
                  <div>
                    <span className="font-bebas text-[14px] tracking-[0.1em] text-hush-white">
                      {opt.label}
                    </span>
                    <span className="ml-2 font-outfit text-[11px] text-hush-muted2">
                      {opt.help}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="font-bebas text-[10px] tracking-[0.2em] text-hush-gold">SELECTED</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="price"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Price (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="50.00"
            required
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label
            htmlFor="booking_url"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Booking link
          </label>
          <input
            id="booking_url"
            name="booking_url"
            type="url"
            placeholder="https://posh.vip/e/your-event"
            required
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[13px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
          <p className="mt-1.5 font-outfit text-[10px] leading-snug text-hush-muted">
            Where the AI sends them after the keyword fires.
          </p>
        </div>

        <div>
          <label
            htmlFor="ai_reply"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            AI reply text
          </label>
          <textarea
            id="ai_reply"
            name="ai_reply"
            rows={4}
            maxLength={320}
            placeholder="You're in! Tap below for your link — see you tonight."
            required
            className="w-full resize-none rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[13px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
          <p className="mt-1.5 font-outfit text-[10px] leading-snug text-hush-muted">
            Sent verbatim when a guest texts the keyword. Booking link auto-appended.
          </p>
        </div>

        {error && (
          <div className="font-outfit text-[12px] leading-snug text-hush-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-hush-gold-btn mt-3 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'SAVING...' : 'CREATE KEYWORD'}
        </button>
      </form>
    </main>
  );
}
