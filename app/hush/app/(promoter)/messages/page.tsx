// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MessagesTabs from './MessagesTabs';
import KeywordRow from './KeywordRow';
import SmsFeed from './SmsFeed';

type SearchParams = { tab?: string };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id, brand_name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const tab = searchParams.tab === 'feed' ? 'feed' : 'keywords';

  const [keywordsRes, eventsRes, messagesRes] = await Promise.all([
    supabase
      .from('hush_keywords')
      .select('id, keyword, tier, price, ai_reply, booking_url, is_active, used_count, event_id, hush_events!inner(title, event_date)')
      .eq('promoter_id', promoter.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('hush_events')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', promoter.id),
    supabase
      .from('hush_messages')
      .select('id, direction, body, from_phone, to_phone, matched, created_at, keyword_id, hush_keywords(keyword)')
      .eq('promoter_id', promoter.id)
      .order('created_at', { ascending: false })
      .limit(80),
  ]);

  const keywords = keywordsRes.data ?? [];
  const eventCount = eventsRes.count ?? 0;
  const messages = (messagesRes.data ?? []).map((m) => {
    const kw = Array.isArray(m.hush_keywords)
      ? m.hush_keywords[0]
      : (m.hush_keywords as { keyword: string } | null);
    return {
      id: m.id as string,
      direction: m.direction as 'inbound' | 'outbound',
      body: m.body as string,
      fromPhone: m.from_phone as string,
      toPhone: m.to_phone as string,
      matched: !!m.matched,
      createdAt: m.created_at as string,
      keyword: kw?.keyword ?? null,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
            MESSAGES
          </p>
          <h1 className="mt-0.5 font-bebas text-[28px] leading-tight tracking-wide text-hush-white">
            Inbox &amp; keywords.
          </h1>
        </div>
      </header>

      <MessagesTabs active={tab} />

      {tab === 'keywords' ? (
        <section className="mt-5">
          {eventCount === 0 ? (
            <div className="rounded-xl border border-hush-gline bg-hush-card p-5 text-center">
              <p className="font-cormorant text-[16px] italic text-hush-white">
                Keywords ride on events.
              </p>
              <p className="mt-1 font-outfit text-[12px] text-hush-muted2">
                Create an event first, then attach keywords to it.
              </p>
              <Link
                href="/hush/app/events/new"
                className="bg-hush-gold-btn mt-4 inline-flex items-center justify-center rounded-md px-5 py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
              >
                CREATE EVENT
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/hush/app/messages/new-keyword"
                className="bg-hush-gold-btn flex w-full items-center justify-center rounded-md py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
              >
                + ADD KEYWORD
              </Link>

              {keywords.length === 0 ? (
                <div className="mt-4 rounded-lg border border-hush-gline/50 bg-hush-card/50 px-4 py-8 text-center">
                  <p className="font-cormorant text-[14px] italic text-hush-muted">
                    No keywords yet. Add one to start auto-replying.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {keywords.map((kw) => {
                    const evt = Array.isArray(kw.hush_events)
                      ? kw.hush_events[0]
                      : (kw.hush_events as { title: string } | null);
                    return (
                      <KeywordRow
                        key={kw.id}
                        id={kw.id}
                        keyword={kw.keyword}
                        tier={kw.tier as 'vip' | 'general' | 'new'}
                        price={Number(kw.price)}
                        isActive={kw.is_active}
                        usedCount={kw.used_count}
                        eventTitle={evt?.title ?? '—'}
                      />
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      ) : (
        <SmsFeed messages={messages} />
      )}
    </main>
  );
}
