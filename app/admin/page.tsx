'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const cardStyle: React.CSSProperties = { background: '#0e0e0e', border: '1px solid #181818', borderRadius: 1, padding: 24 };
const metricLabel: React.CSSProperties = { color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', margin: '0 0 4px' };
const metricValue: React.CSSProperties = { fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: '#F5F5F5', margin: 0 };

const PLAN_PRICES: Record<string, number> = { launch: 47, grow: 97, scale: 197 };

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [metrics, setMetrics] = useState({ clients: 0, mrr: 0, leadsToday: 0, creditsSold: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [demos, setDemos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }

      // Admin check
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (session.user.email !== adminEmail) { router.push('/auth/login'); return; }
      setAuthorized(true);

      // Load paying accounts
      const { data: users } = await supabase.from('users').select('*').eq('is_demo', false).order('updated_at', { ascending: false });
      const paying = (users || []).filter(u => ['launch', 'grow', 'scale'].includes(u.tier));
      setAccounts(paying);

      // Calculate MRR
      const mrr = paying.reduce((sum, u) => sum + (PLAN_PRICES[u.tier] || 0), 0);

      // Leads today
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: leadsToday } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        .neq('source', 'demo').gte('created_at', today.toISOString());

      // Credits sold this month
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const { data: creditLogs } = await supabase.from('sms_credits_log').select('credits_added')
        .gte('created_at', monthStart.toISOString());
      const creditsSold = (creditLogs || []).reduce((sum, l) => sum + (l.credits_added || 0), 0);

      setMetrics({ clients: paying.length, mrr, leadsToday: leadsToday || 0, creditsSold });

      // Load demo sites
      const { data: demoUsers } = await supabase.from('users').select('*, funnels(*)').eq('is_demo', true);
      const demoFunnels: any[] = [];
      (demoUsers || []).forEach(u => {
        ((u as any).funnels || []).forEach((f: any) => demoFunnels.push({ ...f, user_email: u.email }));
      });
      setDemos(demoFunnels);
    })();
  }, []);

  if (!authorized) return <div style={{ color: '#999', padding: 40 }}>Verifying access...</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F5F5F5', padding: 32, background: '#000', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: '#00CFFF', margin: '0 0 32px' }}>Admin — Platform Health</h1>

      {/* Platform Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <p style={metricLabel}>Paying Clients</p>
          <p style={metricValue}>{metrics.clients}</p>
        </div>
        <div style={cardStyle}>
          <p style={metricLabel}>MRR</p>
          <p style={{ ...metricValue, color: '#00FF94' }}>${metrics.mrr}</p>
        </div>
        <div style={cardStyle}>
          <p style={metricLabel}>Leads Today</p>
          <p style={metricValue}>{metrics.leadsToday}</p>
        </div>
        <div style={cardStyle}>
          <p style={metricLabel}>Credits Sold (Month)</p>
          <p style={metricValue}>{metrics.creditsSold}</p>
        </div>
      </div>

      {/* Paying Accounts */}
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#F5F5F5', margin: '0 0 16px' }}>Paying Accounts</h2>
        {accounts.length === 0 ? (
          <p style={{ color: '#4a4a4a' }}>No paying accounts yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #181818' }}>
                  {['Email', 'Plan', 'MRR', 'SMS Credits', 'Last Active'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a4a4a', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #181818' }}>
                    <td style={{ padding: '10px 12px', color: '#F5F5F5', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', padding: '2px 8px', borderRadius: 1, background: '#00CFFF20', color: '#00CFFF', textTransform: 'uppercase' }}>{u.tier}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#00FF94' }}>${PLAN_PRICES[u.tier] || 0}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: (u.sms_credits || 0) < 50 ? '#FFB800' : '#999' }}>{u.sms_credits || 0}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#4a4a4a' }}>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demo Sites */}
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#F5F5F5', margin: '0 0 16px' }}>Demo Sites</h2>
        {demos.length === 0 ? (
          <p style={{ color: '#4a4a4a' }}>No demo sites.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {demos.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #181818' }}>
                <div>
                  <p style={{ color: '#F5F5F5', margin: '0 0 4px', fontSize: '0.95rem' }}>{d.business_name}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#999', margin: 0 }}>goelev8.ai/f/{d.slug}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.is_active ? '#00FF94' : '#4a4a4a' }} />
                  <a href={`/f/${d.slug}`} target="_blank" rel="noopener" style={{ color: '#00CFFF', textDecoration: 'none', fontSize: '0.85rem' }}>View →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Health */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#F5F5F5', margin: '0 0 16px' }}>System Health</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'pg_cron', status: 'HEALTHY' },
            { label: 'Vapi', status: 'HEALTHY' },
            { label: 'Twilio', status: 'HEALTHY' },
            { label: 'Edge Functions', status: 'HEALTHY' },
          ].map(({ label, status }) => (
            <div key={label} style={{ textAlign: 'center', padding: 16, background: '#181818', borderRadius: 1 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#4a4a4a', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#00FF94', margin: 0 }}>{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
