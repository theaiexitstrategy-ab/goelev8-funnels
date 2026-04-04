// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';

type Analytics = {
  leads_by_day: { date: string; count: number }[];
  lead_sources: { source: string; count: number }[];
  sms_performance: { step: number; replied_pct: number }[];
  booking_conversion: number;
  top_funnels: { name: string; slug: string; leads: number }[];
  call_outcomes: { outcome: string; count: number }[];
  total_leads: number;
  total_revenue_cents: number;
};

const RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const SOURCE_COLORS: Record<string, string> = {
  funnel: '#00CFFF', chat: '#8B5CF6', site_connect: '#F59E0B', blast: '#EC4899', store: '#10B981', widget: '#3B82F6',
};

const OUTCOME_COLORS: Record<string, string> = {
  booked: '#10B981', interested: '#00CFFF', not_interested: '#F59E0B', no_answer: '#EF4444',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${range}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const maxLeadsDay = data?.leads_by_day ? Math.max(...data.leads_by_day.map((d) => d.count), 1) : 1;
  const totalSourceCount = data?.lead_sources?.reduce((sum, s) => sum + s.count, 0) || 1;
  const totalOutcomeCount = data?.call_outcomes?.reduce((sum, o) => sum + o.count, 0) || 1;

  const handleExportCSV = async () => {
    const res = await fetch(`/api/analytics/export?days=${range}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: 0 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)} style={{
              background: range === r.value ? '#2563EB' : '#F3F4F6', color: range === r.value ? '#fff' : '#6B7280',
              border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            }}>{r.label}</button>
          ))}
          <button onClick={handleExportCSV} style={{
            background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
            borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', marginLeft: 8,
          }}>Download CSV</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading analytics...</div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>No data available yet. Start capturing leads to see analytics.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Leads', value: data.total_leads.toLocaleString() },
              { label: 'Booking Rate', value: `${data.booking_conversion}%` },
              { label: 'Revenue', value: `$${(data.total_revenue_cents / 100).toFixed(2)}` },
            ].map((card) => (
              <div key={card.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>{card.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Leads per day chart */}
          <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Leads Per Day</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, overflow: 'hidden' }}>
              {data.leads_by_day.map((day) => (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div style={{
                    width: '100%', maxWidth: 20,
                    height: `${Math.max((day.count / maxLeadsDay) * 140, 2)}px`,
                    background: '#2563EB', borderRadius: '3px 3px 0 0',
                  }} title={`${day.date}: ${day.count} leads`} />
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Lead sources */}
            <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Lead Sources</h2>
              {data.lead_sources.map((s) => (
                <div key={s.source} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', color: '#374151' }}>{s.source.replace('_', ' ')}</span>
                    <span style={{ color: '#6B7280' }}>{s.count} ({Math.round((s.count / totalSourceCount) * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / totalSourceCount) * 100}%`, background: SOURCE_COLORS[s.source] || '#6B7280', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </section>

            {/* SMS Performance */}
            <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>SMS Sequence Performance</h2>
              {data.sms_performance.map((s) => (
                <div key={s.step} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#374151' }}>Step {s.step}</span>
                    <span style={{ color: '#6B7280' }}>{s.replied_pct}% replied</span>
                  </div>
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.replied_pct}%`, background: '#10B981', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {/* Top funnels */}
            <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Funnels</h2>
              {data.top_funnels.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>No funnels yet.</p>
              ) : data.top_funnels.map((f, i) => (
                <div key={f.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.top_funnels.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{f.name}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>/f/{f.slug}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2563EB' }}>{f.leads} leads</span>
                </div>
              ))}
            </section>

            {/* AI Call Outcomes */}
            <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI Call Outcomes</h2>
              {data.call_outcomes.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>No calls yet. Available on Grow plan and above.</p>
              ) : data.call_outcomes.map((o) => (
                <div key={o.outcome} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', color: '#374151' }}>{o.outcome.replace('_', ' ')}</span>
                    <span style={{ color: '#6B7280' }}>{o.count} ({Math.round((o.count / totalOutcomeCount) * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(o.count / totalOutcomeCount) * 100}%`, background: OUTCOME_COLORS[o.outcome] || '#6B7280', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
