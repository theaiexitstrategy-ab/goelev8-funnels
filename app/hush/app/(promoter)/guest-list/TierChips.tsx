// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';

type Counts = { all: number; vip: number; regular: number; new: number };

const CHIPS: { key: keyof Counts; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vip', label: 'VIP' },
  { key: 'regular', label: 'Regular' },
  { key: 'new', label: 'New' },
];

export default function TierChips({
  active,
  q,
  counts,
}: {
  active: 'all' | 'vip' | 'regular' | 'new';
  q: string;
  counts: Counts;
}) {
  return (
    <nav className="mt-3 flex flex-wrap gap-2" aria-label="Filter by tier">
      {CHIPS.map((chip) => {
        const isActive = active === chip.key;
        const params = new URLSearchParams();
        if (chip.key !== 'all') params.set('tier', chip.key);
        if (q) params.set('q', q);
        const href = params.size > 0 ? `/hush/app/guest-list?${params}` : '/hush/app/guest-list';
        return (
          <Link
            key={chip.key}
            href={href}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bebas text-[12px] tracking-[0.12em] transition-colors ${
              isActive
                ? 'border-hush-gold bg-hush-gdim text-hush-gold'
                : 'border-hush-gline bg-hush-card text-hush-muted2 hover:border-hush-gold hover:text-hush-gold'
            }`}
          >
            <span>{chip.label}</span>
            <span className="font-outfit text-[10px] text-hush-muted">{counts[chip.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
