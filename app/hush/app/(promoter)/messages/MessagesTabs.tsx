// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';

export default function MessagesTabs({ active }: { active: 'keywords' | 'feed' }) {
  return (
    <div className="mt-5 flex gap-2 border-b border-hush-gline">
      <Tab href="/hush/app/messages?tab=keywords" label="Keywords" active={active === 'keywords'} />
      <Tab href="/hush/app/messages?tab=feed" label="SMS Feed" active={active === 'feed'} />
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative px-3 pb-3 font-bebas text-[14px] tracking-[0.15em] transition-colors ${
        active ? 'text-hush-gold' : 'text-hush-muted2'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-px bg-hush-gold" />
      )}
    </Link>
  );
}
