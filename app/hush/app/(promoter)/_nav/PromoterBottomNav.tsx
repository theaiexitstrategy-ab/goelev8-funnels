'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Mobile bottom nav for the promoter side of the Hush PWA. Mirrors the
// reference `.bn` pattern (icon + label + gold pip) from
// reference/hush/hush-integrations-model.html.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Users, Moon, Network, type LucideIcon } from 'lucide-react';

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: '/hush/app/dashboard', label: 'Home', icon: Home, match: (p) => p === '/hush/app/dashboard' || p.startsWith('/hush/app/events') },
  { href: '/hush/app/messages', label: 'Messages', icon: MessageCircle, match: (p) => p.startsWith('/hush/app/messages') },
  { href: '/hush/app/guest-list', label: 'Guests', icon: Users, match: (p) => p.startsWith('/hush/app/guest-list') },
  { href: '/hush/app/tonight', label: 'Tonight', icon: Moon, match: (p) => p.startsWith('/hush/app/tonight') },
  { href: '/hush/app/network', label: 'Network', icon: Network, match: (p) => p.startsWith('/hush/app/network') },
];

export default function PromoterBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Promoter navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-hush-gline bg-hush-black/95 pb-safe backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-[420px] grid-cols-5 px-2 pt-2.5 pb-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 py-1.5"
            >
              <Icon
                size={20}
                strokeWidth={1.75}
                className={active ? 'text-hush-gold' : 'text-hush-white/30'}
                style={{ transition: 'color 0.2s' }}
              />
              <div
                className={`h-1 w-1 rounded-full transition-opacity ${
                  active ? 'bg-hush-gold opacity-100' : 'opacity-0'
                }`}
              />
              <span
                className={`font-outfit text-[9px] uppercase tracking-[0.1em] transition-colors ${
                  active ? 'text-hush-gold' : 'text-hush-muted'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
