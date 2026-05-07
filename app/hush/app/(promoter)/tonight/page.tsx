// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TonightPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id, brand_name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  // Window: events with date within the last 6 hours through next 18 hours.
  // That covers "tonight" whether it's already started, about to start, or
  // wrapping up. If nothing falls in the window, fall back to the next
  // upcoming event.
  const now = new Date();
  const startWindow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const endWindow = new Date(now.getTime() + 18 * 60 * 60 * 1000);

  const { data: liveEvents } = await supabase
    .from('hush_events')
    .select('id, title, venue, city, event_date, doors_open, capacity, status, age_restriction, dress_code')
    .eq('promoter_id', promoter.id)
    .gte('event_date', startWindow.toISOString())
    .lte('event_date', endWindow.toISOString())
    .in('status', ['upcoming', 'live'])
    .order('event_date', { ascending: true })
    .limit(1);

  let event = liveEvents?.[0] ?? null;
  let isFallback = false;
  if (!event) {
    const { data: nextEvents } = await supabase
      .from('hush_events')
      .select('id, title, venue, city, event_date, doors_open, capacity, status, age_restriction, dress_code')
      .eq('promoter_id', promoter.id)
      .gt('event_date', endWindow.toISOString())
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(1);
    event = nextEvents?.[0] ?? null;
    isFallback = !!event;
  }

  if (!event) {
    return (
      <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
        <header>
          <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
            TONIGHT
          </p>
          <h1 className="mt-0.5 font-bebas text-[28px] leading-tight tracking-wide text-hush-white">
            Quiet for now.
          </h1>
        </header>

        <section className="mt-6 rounded-xl border border-hush-gline bg-hush-card p-6 text-center">
          <p className="font-cormorant text-[16px] italic text-hush-white">
            Nothing on the books for tonight.
          </p>
          <p className="mt-1 font-outfit text-[12px] leading-relaxed text-hush-muted2">
            Drop the next one and start selling tickets.
          </p>
          <Link
            href="/hush/app/events/new"
            className="bg-hush-gold-btn mt-5 inline-flex items-center justify-center rounded-md px-5 py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
          >
            CREATE EVENT
          </Link>
        </section>
      </main>
    );
  }

  // Pass aggregates for this event.
  const [confirmedRes, checkedInRes] = await Promise.all([
    supabase
      .from('hush_passes')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'confirmed'),
    supabase
      .from('hush_passes')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'checked_in'),
  ]);

  const confirmed = confirmedRes.count ?? 0;
  const checkedIn = checkedInRes.count ?? 0;
  const totalSold = confirmed + checkedIn;
  const capacity = event.capacity ?? 0;
  const fillPct = capacity > 0 ? Math.min(100, Math.round((totalSold / capacity) * 100)) : 0;

  const eventDate = new Date(event.event_date);
  const dateLabel = eventDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = eventDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const doorsLabel = event.doors_open
    ? new Date(event.doors_open).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const statusLabel = event.status === 'live' ? 'LIVE' : 'UPCOMING';

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
      <header>
        <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
          {isFallback ? 'NEXT UP' : 'TONIGHT'}
        </p>
        <h1 className="mt-0.5 font-bebas text-[28px] leading-tight tracking-wide text-hush-white">
          {dateLabel}
        </h1>
      </header>

      {/* Event hero */}
      <section className="relative mt-5 overflow-hidden rounded-xl border border-hush-gline bg-hush-card p-5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)',
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="bg-hush-gold-text-mid text-fill-transparent font-bebas text-[26px] leading-tight tracking-wide">
              {event.title}
            </h2>
            <p className="mt-1 font-outfit text-[13px] text-hush-muted2">
              {event.venue} &middot; {event.city}
            </p>
          </div>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 font-bebas text-[10px] uppercase tracking-[0.2em] ${
              event.status === 'live'
                ? 'border-[rgba(255,71,87,0.3)] bg-[rgba(255,71,87,0.12)] text-hush-live'
                : 'border-hush-gline bg-hush-gdim text-hush-gold'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4 text-hush-muted2">
          <div className="font-bebas text-[18px] tracking-[0.06em] text-hush-white">
            {timeLabel}
          </div>
          {doorsLabel && (
            <div className="font-outfit text-[11px] uppercase tracking-[0.18em]">
              Doors {doorsLabel}
            </div>
          )}
          {event.age_restriction && (
            <div className="font-outfit text-[11px] uppercase tracking-[0.18em] text-hush-muted">
              {event.age_restriction}
            </div>
          )}
        </div>

        {event.dress_code && (
          <p className="mt-2 font-cormorant text-[13px] italic text-hush-muted2">
            Dress: {event.dress_code}
          </p>
        )}
      </section>

      {/* Door stats */}
      <section className="mt-5 grid grid-cols-3 gap-2.5">
        <DoorStat label="Sold" value={totalSold.toString()} accent />
        <DoorStat label="At Door" value={confirmed.toString()} />
        <DoorStat label="Inside" value={checkedIn.toString()} />
      </section>

      {/* Capacity bar */}
      {capacity > 0 && (
        <section className="mt-5 rounded-lg border border-hush-gline bg-hush-card px-4 py-4">
          <div className="flex items-baseline justify-between">
            <p className="font-outfit text-[10px] uppercase tracking-[0.2em] text-hush-muted">
              Capacity
            </p>
            <p className="font-bebas text-[14px] tracking-[0.08em] text-hush-white">
              {totalSold} / {capacity}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hush-card2">
            <div
              className="h-full bg-hush-gold-gradient transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="mt-1.5 font-outfit text-[10px] text-hush-muted2">
            {fillPct < 70
              ? `${100 - fillPct}% open. Time to blast.`
              : fillPct < 100
                ? `${100 - fillPct}% left. The room is filling.`
                : 'Sold out. The night is yours.'}
          </p>
        </section>
      )}

      {/* Action buttons */}
      <section className="mt-5 flex flex-col gap-2">
        <Link
          href="/hush/app/crm"
          className="bg-hush-gold-btn flex w-full items-center justify-center rounded-md py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
        >
          BLAST THE LIST
        </Link>
        <Link
          href="/hush/app/messages"
          className="flex w-full items-center justify-center rounded-md border border-hush-gline bg-hush-card py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-white transition-colors active:bg-hush-card2"
        >
          MANAGE KEYWORDS
        </Link>
      </section>

      {/* Hype meter placeholder */}
      <section className="mt-7">
        <p className="font-bebas text-[11px] tracking-[0.25em] text-hush-muted">
          Hype Meter
        </p>
        <div className="mt-3 rounded-lg border border-hush-gline/50 bg-hush-card/50 px-4 py-6 text-center">
          <p className="font-cormorant text-[14px] italic text-hush-muted">
            Real-time signups, keyword pings, and door scans land here in 2C.
          </p>
        </div>
      </section>
    </main>
  );
}

function DoorStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-hush-gline bg-hush-card px-3 py-3 text-center">
      <p
        className={`font-bebas text-[24px] leading-none ${
          accent ? 'bg-hush-gold-text-mid text-fill-transparent' : 'text-hush-white'
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 font-outfit text-[9px] uppercase tracking-[0.2em] text-hush-muted">
        {label}
      </p>
    </div>
  );
}
