// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import TierChips from './TierChips';

type Tier = 'all' | 'vip' | 'regular' | 'new';

type SearchParams = { tier?: string; q?: string };

const TIER_PILL: Record<'vip' | 'regular' | 'new', string> = {
  vip: 'text-hush-gold border-hush-gline bg-hush-gdim',
  regular: 'text-hush-white border-hush-gline bg-hush-card2',
  new: 'text-hush-cyan border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]',
};

const TIER_LABEL: Record<'vip' | 'regular' | 'new', string> = {
  vip: 'VIP',
  regular: 'Regular',
  new: 'New',
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last4 = digits.slice(-4);
  const area = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);
  return `(${area}) ••• ${last4}`;
}

export default async function GuestListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const tier: Tier =
    searchParams.tier === 'vip' || searchParams.tier === 'regular' || searchParams.tier === 'new'
      ? searchParams.tier
      : 'all';
  const q = searchParams.q?.toString().trim() ?? '';

  let query = supabase
    .from('hush_contacts')
    .select('id, name, phone, tier, events_attended, source, created_at')
    .eq('promoter_id', promoter.id)
    .order('events_attended', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (tier !== 'all') query = query.eq('tier', tier);
  if (q.length > 0) {
    // Match on name OR phone digits
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 3) {
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${digits}%`);
    } else {
      query = query.ilike('name', `%${q}%`);
    }
  }

  const { data: contactsData } = await query;
  const contacts = contactsData ?? [];

  // Tier counts (independent of filter so chips show full counts)
  const { data: counts } = await supabase
    .from('hush_contacts')
    .select('tier')
    .eq('promoter_id', promoter.id);
  const tally = { all: 0, vip: 0, regular: 0, new: 0 };
  for (const c of counts ?? []) {
    tally.all += 1;
    const t = c.tier as 'vip' | 'regular' | 'new' | string;
    if (t === 'vip' || t === 'regular' || t === 'new') {
      tally[t] += 1;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6">
      <header>
        <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
          GUEST LIST
        </p>
        <h1 className="mt-0.5 font-bebas text-[28px] leading-tight tracking-wide text-hush-white">
          The list.
        </h1>
        <p className="mt-1 font-cormorant text-[14px] italic text-hush-muted2">
          Everyone who&apos;s walked through your door.
        </p>
      </header>

      {/* Search */}
      <form className="mt-5">
        <label className="relative block">
          <span className="sr-only">Search guests</span>
          <Search
            size={16}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-hush-muted"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or phone"
            className="w-full rounded-md border border-hush-gline bg-hush-card py-2.5 pl-9 pr-3 font-outfit text-[13px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
          {tier !== 'all' && <input type="hidden" name="tier" value={tier} />}
        </label>
      </form>

      <TierChips active={tier} q={q} counts={tally} />

      {tally.all === 0 ? (
        <section className="mt-6 rounded-xl border border-hush-gline bg-hush-card p-6 text-center">
          <p className="font-cormorant text-[16px] italic text-hush-white">
            No guests yet.
          </p>
          <p className="mt-1 font-outfit text-[12px] leading-relaxed text-hush-muted2">
            Contacts grow automatically when guests text your keyword. Or import a CSV from your last list.
          </p>
          <Link
            href="/hush/app/crm"
            className="bg-hush-gold-btn mt-5 inline-flex items-center justify-center rounded-md px-5 py-3 font-bebas text-[14px] tracking-[0.18em] text-hush-black shadow-[0_8px_28px_rgba(201,168,76,0.22)] transition-transform active:scale-[0.98]"
          >
            IMPORT CONTACTS
          </Link>
        </section>
      ) : contacts.length === 0 ? (
        <section className="mt-6 rounded-lg border border-hush-gline/50 bg-hush-card/50 px-4 py-8 text-center">
          <p className="font-cormorant text-[14px] italic text-hush-muted">
            No matches{q ? ` for "${q}"` : ''} in this tier.
          </p>
        </section>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {contacts.map((c) => {
            const t = (c.tier === 'vip' || c.tier === 'new' ? c.tier : 'regular') as keyof typeof TIER_PILL;
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-hush-gline bg-hush-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bebas text-[16px] tracking-[0.06em] text-hush-white">
                    {c.name}
                  </p>
                  <p className="mt-0.5 font-outfit text-[11px] text-hush-muted2">
                    {maskPhone(c.phone)} &middot; {c.events_attended} event
                    {c.events_attended === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full border px-2 py-0.5 font-bebas text-[10px] uppercase tracking-[0.18em] ${TIER_PILL[t]}`}
                >
                  {TIER_LABEL[t]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {tally.all > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="font-outfit text-[10px] uppercase tracking-[0.25em] text-hush-muted">
            Showing {contacts.length} of {tally[tier]}
          </p>
          <Link
            href="/hush/app/crm"
            className="font-bebas text-[12px] tracking-[0.2em] text-hush-gold"
          >
            BLAST →
          </Link>
        </div>
      )}
    </main>
  );
}
