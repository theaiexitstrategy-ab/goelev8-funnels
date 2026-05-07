// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PromoterDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id, brand_name, keyword_prefix, subscription_status, monthly_credit_allowance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const { data: hushUser } = await supabase
    .from('hush_users')
    .select('credit_balance, tier')
    .eq('id', user.id)
    .single();

  // Stats — three queries fire in parallel.
  const [eventsRes, keywordsRes, passesRes] = await Promise.all([
    supabase
      .from('hush_events')
      .select('id, title, event_date', { count: 'exact' })
      .eq('promoter_id', promoter.id)
      .in('status', ['upcoming', 'live'])
      .order('event_date', { ascending: true })
      .limit(3),
    supabase
      .from('hush_keywords')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', promoter.id)
      .eq('is_active', true),
    supabase
      .from('hush_passes')
      .select('price_paid, hush_events!inner(promoter_id)', { count: 'exact' })
      .eq('hush_events.promoter_id', promoter.id)
      .in('status', ['confirmed', 'checked_in']),
  ]);

  const upcomingEvents = eventsRes.data ?? [];
  const upcomingCount = eventsRes.count ?? 0;
  const activeKeywordCount = keywordsRes.count ?? 0;
  const ticketsSold = passesRes.count ?? 0;
  const grossRevenue = (passesRes.data ?? []).reduce(
    (sum, p) => sum + Number(p.price_paid ?? 0),
    0
  );

  const isEmpty = upcomingCount === 0 && ticketsSold === 0 && activeKeywordCount === 0;

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
            HUSH AI
          </p>
          <h1 className="mt-0.5 font-bebas text-[28px] leading-tight tracking-wide text-hush-white">
            {promoter.brand_name}
          </h1>
        </div>
        <CreditBadge balance={hushUser?.credit_balance ?? 0} />
      </header>

      <p className="mt-1 font-cormorant text-[14px] italic text-hush-muted2">
        {promoter.subscription_status === 'trialing'
          ? 'Trial open. Build the night.'
          : 'Welcome back.'}
      </p>

      <section className="mt-6 grid grid-cols-2 gap-2.5">
        <StatCard label="Tickets Sold" value={ticketsSold.toLocaleString()} />
        <StatCard
          label="Revenue"
          value={`$${grossRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
        />
        <StatCard
          label="Events"
          value={upcomingCount.toString()}
          sub={upcomingCount === 0 ? 'No upcoming' : 'Upcoming'}
        />
        <StatCard
          label="Keywords"
          value={activeKeywordCount.toString()}
          sub={activeKeywordCount === 0 ? 'None active' : 'Active'}
        />
      </section>

      {isEmpty ? (
        <section className="mt-7 rounded-xl border border-hush-gline bg-hush-card p-5 text-center">
          <p className="font-cormorant text-[18px] italic text-hush-white">
            Your first event drops here.
          </p>
          <p className="mt-1 font-outfit text-[12px] text-hush-muted2">
            Create the show, generate a keyword, blast your list.
          </p>
          <Link
            href="/hush/app/events/new"
            className="bg-hush-gold-btn mt-5 inline-flex items-center justify-center rounded-md px-6 py-3.5 font-bebas text-[15px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
          >
            CREATE YOUR FIRST EVENT
          </Link>
        </section>
      ) : (
        <Link
          href="/hush/app/events/new"
          className="bg-hush-gold-btn mt-7 flex w-full items-center justify-center rounded-md py-3.5 font-bebas text-[15px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
        >
          + NEW EVENT
        </Link>
      )}

      {upcomingEvents.length > 0 && (
        <section className="mt-7">
          <p className="font-bebas text-[11px] tracking-[0.25em] text-hush-muted">
            Upcoming
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {upcomingEvents.map((evt) => (
              <li
                key={evt.id}
                className="rounded-lg border border-hush-gline bg-hush-card px-4 py-3"
              >
                <p className="font-bebas text-[16px] tracking-[0.06em] text-hush-white">
                  {evt.title}
                </p>
                <p className="mt-0.5 font-outfit text-[11px] text-hush-muted2">
                  {new Date(evt.event_date).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <p className="font-bebas text-[11px] tracking-[0.25em] text-hush-muted">
          Recent Activity
        </p>
        <div className="mt-3 rounded-lg border border-hush-gline/50 bg-hush-card/50 px-4 py-6 text-center">
          <p className="font-cormorant text-[14px] italic text-hush-muted">
            {ticketsSold === 0
              ? 'Sales and keyword pings show up here in real time.'
              : 'Live feed wiring lands next.'}
          </p>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-hush-gline bg-hush-card px-4 py-3.5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
        }}
      />
      <p className="font-outfit text-[10px] uppercase tracking-[0.12em] text-hush-muted">
        {label}
      </p>
      <p className="bg-hush-gold-text-mid text-fill-transparent mt-1.5 font-bebas text-[28px] leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 font-outfit text-[10px] text-hush-muted2">{sub}</p>
      )}
    </div>
  );
}

function CreditBadge({ balance }: { balance: number }) {
  return (
    <Link
      href="/hush/app/credits"
      className="flex items-center gap-1.5 rounded-full border border-[rgba(255,179,71,0.25)] bg-[rgba(255,179,71,0.08)] px-3 py-1.5"
    >
      <span className="font-bebas text-[14px] text-hush-credit">
        {balance.toLocaleString()}
      </span>
      <span className="font-bebas text-[14px] text-hush-credit">✦</span>
    </Link>
  );
}
