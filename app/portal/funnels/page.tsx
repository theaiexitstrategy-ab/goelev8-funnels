'use client';
// app/portal/funnels/page.tsx — Funnel list
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Funnel {
  id: string;
  business_name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  leads_this_month?: number;
}

interface UserProfile {
  tier: string;
  funnel_limit: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TIER_LIMITS: Record<string, number> = {
  launch: 1,
  grow: 3,
  scale: 10,
  white_label: 999,
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: '#F5F5F5',
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '2rem',
    color: '#F5F5F5',
    margin: 0,
    letterSpacing: 1,
  } as React.CSSProperties,
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  } as React.CSSProperties,
  btnCyan: {
    padding: '10px 22px',
    background: '#00CFFF',
    color: '#000',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 15,
    border: 'none',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
    textDecoration: 'none',
    display: 'inline-block',
  } as React.CSSProperties,
  btnUpgrade: {
    padding: '10px 22px',
    background: 'transparent',
    color: '#FFB800',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 15,
    border: '1px solid #FFB800',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
    maxWidth: 1060,
  } as React.CSSProperties,
  card: {
    background: '#0e0e0e',
    border: '1px solid #181818',
    borderRadius: 1,
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,
  cardName: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '1.4rem',
    color: '#F5F5F5',
    margin: 0,
    letterSpacing: 0.5,
  } as React.CSSProperties,
  slug: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#4a4a4a',
    letterSpacing: 0.3,
  } as React.CSSProperties,
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  } as React.CSSProperties,
  dot: (active: boolean) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: active ? '#00FF94' : '#4a4a4a',
    flexShrink: 0,
  }) as React.CSSProperties,
  statusText: (active: boolean) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: active ? '#00FF94' : '#4a4a4a',
  }) as React.CSSProperties,
  leadsLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#999',
  } as React.CSSProperties,
  leadsCount: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '1.8rem',
    color: '#F5F5F5',
    lineHeight: 1,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 'auto',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  btnOutline: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#999',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #202020',
    borderRadius: 1,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  } as React.CSSProperties,
  btnOutlineCyan: {
    padding: '6px 14px',
    background: 'transparent',
    color: '#00CFFF',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #00CFFF',
    borderRadius: 1,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  } as React.CSSProperties,
  liveLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#00CFFF',
    textDecoration: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    color: '#4a4a4a',
    padding: '60px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
  } as React.CSSProperties,
  copied: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#00FF94',
    letterSpacing: 0.3,
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FunnelsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({ tier: 'launch', funnel_limit: 1 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [userRes, funnelRes] = await Promise.all([
        supabase.from('users').select('tier').eq('id', uid).single(),
        supabase
          .from('funnels')
          .select('id, business_name, slug, is_active, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ]);

      const tier = userRes.data?.tier || 'launch';
      setProfile({ tier, funnel_limit: TIER_LIMITS[tier] ?? 1 });

      if (funnelRes.data) {
        /* Count leads per funnel this month */
        const funnelsWithCounts: Funnel[] = await Promise.all(
          funnelRes.data.map(async (f) => {
            const { count } = await supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('funnel_id', f.id)
              .gte('created_at', monthStart.toISOString());
            return { ...f, leads_this_month: count ?? 0 };
          }),
        );
        setFunnels(funnelsWithCounts);
      }

      setLoading(false);
    })();
  }, [supabase]);

  const atLimit = funnels.length >= profile.funnel_limit;

  const copyLink = (slug: string, id: string) => {
    navigator.clipboard.writeText(`https://goelev8.ai/f/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#999', fontSize: 14, padding: 32 }}>
        Loading funnels...
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.topBar}>
        <h1 style={s.title}>Funnels</h1>
        {atLimit ? (
          <button
            style={s.btnUpgrade}
            onClick={() => router.push('/portal/settings/billing')}
          >
            Upgrade to Build More
          </button>
        ) : (
          <button
            style={s.btnCyan}
            onClick={() => router.push('/portal/funnels/new')}
          >
            Build New Funnel
          </button>
        )}
      </div>

      {/* Grid */}
      {funnels.length === 0 ? (
        <div style={s.empty}>No funnels yet. Build your first AI-powered page.</div>
      ) : (
        <div style={s.grid}>
          {funnels.map((f) => (
            <div key={f.id} style={s.card}>
              <h3 style={s.cardName}>{f.business_name}</h3>
              <div style={s.slug}>goelev8.ai/f/{f.slug}</div>

              <div style={s.statusRow}>
                <div style={s.dot(f.is_active)} />
                <span style={s.statusText(f.is_active)}>
                  {f.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <div style={s.leadsLabel}>Leads this month</div>
                <div style={s.leadsCount}>{f.leads_this_month ?? 0}</div>
              </div>

              <div style={s.actions}>
                <button
                  style={s.btnOutlineCyan}
                  onClick={() => router.push(`/portal/funnels/${f.id}`)}
                >
                  Edit
                </button>
                <button
                  style={s.btnOutline}
                  onClick={() => copyLink(f.slug, f.id)}
                >
                  {copiedId === f.id ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={`https://goelev8.ai/f/${f.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.liveLink}
                >
                  View Live &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
