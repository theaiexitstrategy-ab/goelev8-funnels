// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import KeywordForm from './form';

export default async function NewKeywordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id, keyword_prefix')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const { data: events } = await supabase
    .from('hush_events')
    .select('id, title, event_date')
    .eq('promoter_id', promoter.id)
    .in('status', ['upcoming', 'live'])
    .order('event_date', { ascending: true });

  const list = events ?? [];

  if (list.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
        <div className="rounded-xl border border-hush-gline bg-hush-card p-6 text-center">
          <p className="font-cormorant text-[16px] italic text-hush-white">
            No upcoming events to attach a keyword to.
          </p>
          <p className="mt-1 font-outfit text-[12px] text-hush-muted2">
            Create an event first.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/hush/app/events/new"
              className="bg-hush-gold-btn inline-flex items-center justify-center rounded-md py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black"
            >
              CREATE EVENT
            </Link>
            <Link
              href="/hush/app/messages"
              className="font-bebas text-[12px] tracking-[0.2em] text-hush-muted2"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <KeywordForm
      events={list.map((e) => ({
        id: e.id,
        title: e.title,
        event_date: e.event_date,
      }))}
      keywordPrefix={promoter.keyword_prefix}
    />
  );
}
