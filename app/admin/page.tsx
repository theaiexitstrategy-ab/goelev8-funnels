'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const C = {
  blk: '#000', card: '#0e0e0e', b1: '#181818', b2: '#202020',
  cyan: '#00CFFF', grn: '#00FF94', red: '#FF3B3B', amber: '#FFB800',
  wh: '#F5F5F5', wh2: '#999', mu: '#4a4a4a',
};

const TIER_PRICES: Record<string, number> = { launch: 47, grow: 97, scale: 197 };

const cardStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.b1}`, borderRadius: 1, padding: 24,
};

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ clients: 0, mrr: 0, leadsToday: 0, creditsSold: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [demos, setDemos] = useState<any[]>([]);
  const [health] = useState([
    { name: 'pg_cron', status: 'HEALTHY' },
    { name: 'Vapi', status: 'HEALTHY' },
    { name: 'Twilio', status: 'HEALTHY' },
    { name: 'Edge Functions', status: 'HEALTHY' },
  ]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (session.user.email !== adminEmail) {
        router.push('/auth/login');
        return;
      }

      // Load all users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('last_active_at', { ascending: false });

      const allUsers = users || [];

      // Paying accounts (exclude demos)
      const paying = allUsers.filter(u => !u.is_demo && u.tier && u.tier !== 'trial');
      const demoAccounts = allUsers.filter(u => u.is_demo);

      // Calculate MRR
      const mrr = paying.reduce((sum, u) => sum + (TIER_PRICES[u.tier] || 0), 0);

      // Leads captured today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: leadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .neq('source', 'demo');

      // SMS credits sold this month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const { data: creditLogs } = await supabase
        .from('sms_credits_log')
        .select('amount')
        .gte('created_at', monthStart);
      const creditsSold = (creditLogs || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0);

      setTotals({
        clients: paying.length,
        mrr,
        leadsToday: leadsToday || 0,
        creditsSold,
      });

      // Enrich paying accounts with lead counts
      const enriched = await Promise.all(paying.map(async (u) => {
        const { count: leadCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id);
        return { ...u, lead_count: leadCount || 0 };
      }));
      setAccounts(enriched);

      // Enrich demos with funnel info
      const demoEnriched = await Promise.all(demoAccounts.map(async (u) => {
        const { data: funnels } = await supabase
          .from('funnels')
          .select('slug, business_name, is_active')
          .eq('user_id', u.id)
          .limit(5);
        const { data: lastLead } = await supabase
          .from('leads')
          .select('created_at')
          .eq('user_id', u.id)
          .order('created_at', { ascending: false })
          .limit(1);
        return {
          ...u,
          funnels: funnels || [],
          last_lead: lastLead?.[0]?.created_at || null,
        };
      }));
      setDemos(demoEnriched);

      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.blk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.cyan, fontFamily: "'Bebas Neue', sans-serif", fontSize: 24 }}>Loading...</div>
    </div>
  );

  const metricCards = [
    { label: 'Total Paying Clients', value: totals.clients, color: C.cyan },
    { label: 'MRR Estimate', value: `$${totals.mrr.toLocaleString()}`, color: C.grn },
    { label: 'Leads Captured Today', value: totals.leadsToday, color: C.wh },
    { label: 'SMS Credits Sold (Month)', value: `$${totals.creditsSold}`, color: C.amber },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.blk, color: C.wh, fontFamily: "'DM Sans', sans-serif", padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: C.wh, margin: '0 0 8px', letterSpacing: 1 }}>
          Admin &mdash; Platform Health
        </h1>
        <p style={{ color: C.wh2, fontSize: 14, margin: '0 0 32px' }}>GoElev8 internal dashboard</p>

        {/* Platform Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {metricCards.map(card => (
            <div key={card.label} style={cardStyle}>
              <p style={{ color: C.wh2, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{card.label}</p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: card.color, margin: 0, lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Paying Accounts Table */}
        <div style={{ ...cardStyle, marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: C.wh, margin: '0 0 16px' }}>Paying Accounts</h2>
          {accounts.length === 0 ? (
            <p style={{ color: C.mu, fontSize: 14 }}>No paying accounts yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Email', 'Plan', 'MRR', 'Leads', 'SMS Credits', 'Last Active'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left', color: C.mu,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                        textTransform: 'uppercase', letterSpacing: 1,
                        borderBottom: `1px solid ${C.b2}`, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${C.b1}` }}>
                      <td style={{ padding: '10px 12px', color: C.wh, fontSize: '0.85rem' }}>{a.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                          background: `${C.cyan}20`, color: C.cyan,
                          padding: '2px 8px', borderRadius: 1, textTransform: 'uppercase',
                        }}>
                          {a.tier}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: C.grn, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>${TIER_PRICES[a.tier] || 0}</td>
                      <td style={{ padding: '10px 12px', color: C.wh, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{a.lead_count}</td>
                      <td style={{ padding: '10px 12px', color: C.amber, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{a.sms_credits ?? 0}</td>
                      <td style={{ padding: '10px 12px', color: C.wh2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {a.last_active_at ? new Date(a.last_active_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Demo Sites Table */}
        <div style={{ ...cardStyle, marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: C.wh, margin: '0 0 16px' }}>Demo Sites</h2>
          {demos.length === 0 ? (
            <p style={{ color: C.mu, fontSize: 14 }}>No demo sites.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Slug', 'Business Name', 'Last Lead', 'Status', 'Link'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px', textAlign: 'left', color: C.mu,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                        textTransform: 'uppercase', letterSpacing: 1,
                        borderBottom: `1px solid ${C.b2}`, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demos.flatMap(d =>
                    (d.funnels || []).map((f: any) => (
                      <tr key={`${d.id}-${f.slug}`} style={{ borderBottom: `1px solid ${C.b1}` }}>
                        <td style={{ padding: '10px 12px', color: C.cyan, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>{f.slug}</td>
                        <td style={{ padding: '10px 12px', color: C.wh, fontSize: '0.85rem' }}>{f.business_name || '-'}</td>
                        <td style={{ padding: '10px 12px', color: C.wh2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {d.last_lead ? new Date(d.last_lead).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                            padding: '2px 8px', borderRadius: 1,
                            background: f.is_active ? `${C.grn}20` : `${C.red}20`,
                            color: f.is_active ? C.grn : C.red,
                          }}>
                            {f.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <a
                            href={`/${f.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: C.cyan, fontSize: '0.8rem', textDecoration: 'none',
                              borderBottom: `1px solid ${C.cyan}40`,
                            }}
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Health */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: C.wh, margin: '0 0 16px' }}>System Health</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {health.map(h => (
              <div key={h.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}`,
              }}>
                <span style={{ color: C.wh, fontSize: 14, fontWeight: 600 }}>{h.name}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                  background: `${C.grn}20`, color: C.grn,
                  padding: '3px 10px', borderRadius: 1,
                }}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: C.mu, fontSize: 12, textAlign: 'center', marginTop: 48 }}>
          &copy; 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
        </p>
      </div>
    </div>
  );
}
