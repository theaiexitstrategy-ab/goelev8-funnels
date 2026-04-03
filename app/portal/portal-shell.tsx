'use client';
// app/portal/portal-shell.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  children: React.ReactNode;
  email: string;
  tier: string;
  smsCredits: number;
  trialEndsAt: string | null;
  hasVapi: boolean;
  hasTwilio: boolean;
  a2pStatus: string;
}

/* ------------------------------------------------------------------ */
/*  Nav definition                                                     */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  gated?: string; // tier gate badge text
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Leads', href: '/portal/leads' },
      { label: 'Funnels', href: '/portal/funnels' },
    ],
  },
  {
    title: 'MESSAGING',
    items: [
      { label: 'SMS Blasts', href: '/portal/sms', gated: 'launch' },
      { label: 'Sequences', href: '/portal/sequences' },
    ],
  },
  {
    title: 'REVENUE',
    items: [
      { label: 'Products', href: '/portal/products' },
      { label: 'Analytics', href: '/portal/analytics' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '/portal/settings/profile' },
      { label: 'Billing', href: '/portal/settings/billing' },
      { label: 'Calendar', href: '/portal/settings/calendar' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function tierLabel(tier: string) {
  const map: Record<string, string> = {
    trial: 'TRIAL',
    launch: 'LAUNCH',
    grow: 'GROW',
    scale: 'SCALE',
    cancelled: 'CANCELLED',
  };
  return map[tier] ?? tier.toUpperCase();
}

function tierBadgeStyle(tier: string): React.CSSProperties {
  if (tier === 'trial')
    return { background: '#FFB800', color: '#000' };
  if (tier === 'cancelled')
    return { background: '#FF3B3B', color: '#F5F5F5' };
  return { background: '#00CFFF', color: '#000' };
}

function isActive(pathname: string, href: string) {
  if (href === '/portal') return pathname === '/portal';
  return pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/*  Breadcrumb                                                         */
/* ------------------------------------------------------------------ */

function Breadcrumb({ pathname }: { pathname: string }) {
  const parts = pathname.replace('/portal', '').split('/').filter(Boolean);
  if (parts.length === 0) return <span style={{ color: '#999' }}>Dashboard</span>;
  return (
    <span style={{ color: '#999', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
      {parts.map((p, i) => (
        <span key={p}>
          {i > 0 && <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>}
          <span style={{ textTransform: 'capitalize' }}>{decodeURIComponent(p)}</span>
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortalShell({
  children,
  email,
  tier,
  smsCredits,
  trialEndsAt,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const remaining = daysLeft(trialEndsAt);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000' }}>
      {/* ---------------------------------------------------------- */}
      {/*  SIDEBAR                                                    */}
      {/* ---------------------------------------------------------- */}
      <aside
        style={{
          width: 220,
          minHeight: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: '#060606',
          borderRight: '1px solid #181818',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '24px 20px 16px',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 22,
            color: '#00CFFF',
            letterSpacing: 1,
          }}
        >
          GoElev8.ai
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          {NAV.map((section) => (
            <div key={section.title} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: '#4a4a4a',
                  padding: '12px 20px 4px',
                  letterSpacing: 1.5,
                }}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: active ? '#00CFFF' : '#F5F5F5',
                      textDecoration: 'none',
                      borderLeft: active
                        ? '3px solid #00CFFF'
                        : '3px solid transparent',
                      background: 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#0e0e0e';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span>{item.label}</span>

                    {/* SMS low-credit amber dot */}
                    {item.label === 'SMS Blasts' && smsCredits < 50 && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#FFB800',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Tier gate badge */}
                    {item.gated && tier === item.gated && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 1,
                          background: '#FFB800',
                          color: '#000',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          lineHeight: '14px',
                        }}
                      >
                        GROW+
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: tier badge + upgrade + trial counter */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #181818',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Tier badge */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              textTransform: 'uppercase',
              padding: '3px 10px',
              borderRadius: 1,
              alignSelf: 'flex-start',
              letterSpacing: 1,
              fontWeight: 500,
              ...tierBadgeStyle(tier),
            }}
          >
            {tierLabel(tier)}
          </span>

          {/* Upgrade link */}
          {tier !== 'scale' && (
            <Link
              href="/portal/settings/billing"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: '#00CFFF',
                textDecoration: 'none',
              }}
            >
              Upgrade &rarr;
            </Link>
          )}

          {/* Trial days remaining */}
          {tier === 'trial' && remaining !== null && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#FFB800',
              }}
            >
              {remaining} day{remaining !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------------- */}
      {/*  MAIN AREA                                                   */}
      {/* ---------------------------------------------------------- */}
      <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {/* Top bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            height: 54,
            background: '#000',
            borderBottom: '1px solid #181818',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            zIndex: 30,
          }}
        >
          <Breadcrumb pathname={pathname} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          >
            <span style={{ color: '#999' }}>{email}</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid #181818',
                color: '#999',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#F5F5F5';
                (e.currentTarget as HTMLElement).style.borderColor = '#999';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#999';
                (e.currentTarget as HTMLElement).style.borderColor = '#181818';
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: 32 }}>{children}</main>
      </div>
    </div>
  );
}
