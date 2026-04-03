'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const cardStyle: React.CSSProperties = { background: '#0e0e0e', border: '1px solid #181818', borderRadius: 1, padding: 24, marginBottom: 20 };
const inputStyle: React.CSSProperties = { width: '100%', padding: 10, background: '#202020', border: '1px solid #181818', color: '#F5F5F5', borderRadius: 1, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', resize: 'vertical' as const, minHeight: 60 };
const labelStyle: React.CSSProperties = { display: 'block', color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 };

const SMS_FIELDS = [
  { key: 'sms_day0', label: 'Day 0 (Immediate)', desc: 'Sent ~60 seconds after opt-in' },
  { key: 'sms_day1', label: 'Day 1', desc: 'Value tip for the industry' },
  { key: 'sms_day3', label: 'Day 3', desc: 'Soft close, surface the offer' },
  { key: 'sms_day7', label: 'Day 7', desc: 'Direct ask, yes or no' },
  { key: 'sms_day14', label: 'Day 14', desc: 'Reactivation, new angle' },
];

export default function SequencesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [sms, setSms] = useState<Record<string, string>>({});
  const [activeLeads, setActiveLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ inSequence: 0, sentToday: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setUserId(session.user.id);
      const { data: f } = await supabase.from('funnels').select('*').eq('user_id', session.user.id).eq('is_active', true);
      setFunnels(f || []);
      if (f?.[0]) selectFunnel(f[0], session.user.id);
    })();
  }, []);

  const selectFunnel = async (funnel: any, uid?: string) => {
    setSelectedFunnel(funnel);
    setSms({
      sms_day0: funnel.sms_day0 || '', sms_day1: funnel.sms_day1 || '',
      sms_day3: funnel.sms_day3 || '', sms_day7: funnel.sms_day7 || '',
      sms_day14: funnel.sms_day14 || '',
    });
    const id = uid || userId;
    // Load active sequence leads
    const { data: leads } = await supabase.from('leads').select('id, full_name, sms_step, next_sms_at, status')
      .eq('funnel_id', funnel.id).eq('status', 'sms_sequence').order('next_sms_at', { ascending: true }).limit(50);
    setActiveLeads(leads || []);
    // Stats
    const { count: seqCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('funnel_id', funnel.id).eq('status', 'sms_sequence');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { count: sentCount } = await supabase.from('sms_log').select('*', { count: 'exact', head: true })
      .eq('funnel_id', funnel.id).eq('direction', 'outbound').gte('created_at', today.toISOString());
    setStats({ inSequence: seqCount || 0, sentToday: sentCount || 0 });
  };

  const saveSequence = async () => {
    if (!selectedFunnel) return;
    setSaving(true); setMsg('');
    await supabase.from('funnels').update(sms).eq('id', selectedFunnel.id);
    setSaving(false); setMsg('Sequence saved.');
  };

  const pauseLead = async (leadId: string) => {
    await supabase.from('leads').update({ next_sms_at: null }).eq('id', leadId);
    setActiveLeads(prev => prev.filter(l => l.id !== leadId));
    setStats(prev => ({ ...prev, inSequence: prev.inSequence - 1 }));
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: '#F5F5F5', margin: '0 0 24px' }}>SMS Sequences</h1>

      {msg && <p style={{ color: '#00FF94', fontSize: '0.9rem', marginBottom: 16 }}>{msg}</p>}

      {/* Funnel selector */}
      {funnels.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <select value={selectedFunnel?.id || ''} onChange={e => { const f = funnels.find(x => x.id === e.target.value); if (f) selectFunnel(f); }}
            style={{ padding: '10px 16px', background: '#202020', border: '1px solid #181818', color: '#F5F5F5', borderRadius: 1, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>
            {funnels.map(f => <option key={f.id} value={f.id}>{f.business_name || f.slug}</option>)}
          </select>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={cardStyle}>
          <p style={{ color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', margin: '0 0 4px' }}>In Sequence</p>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#00CFFF', margin: 0 }}>{stats.inSequence}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', margin: '0 0 4px' }}>Sent Today</p>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#F5F5F5', margin: 0 }}>{stats.sentToday}</p>
        </div>
      </div>

      {/* Sequence Editor */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#F5F5F5', margin: '0 0 16px' }}>Sequence Messages</h2>
        {SMS_FIELDS.map(({ key, label, desc }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            <p style={{ color: '#4a4a4a', fontSize: '0.75rem', margin: '0 0 6px' }}>{desc}</p>
            <textarea value={sms[key] || ''} onChange={e => setSms({ ...sms, [key]: e.target.value })} style={inputStyle} maxLength={160} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#4a4a4a' }}>Preview: {(sms[key] || '').replace(/\[Name\]/g, 'Sarah')}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: (sms[key]?.length || 0) > 160 ? '#FF3B3B' : '#4a4a4a' }}>{sms[key]?.length || 0}/160</span>
            </div>
          </div>
        ))}
        <button onClick={saveSequence} disabled={saving} style={{ padding: '12px 24px', background: '#00CFFF', color: '#000', border: 'none', borderRadius: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Active Leads */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#F5F5F5', margin: '0 0 16px' }}>Active Sequence Leads</h2>
        {activeLeads.length === 0 ? (
          <p style={{ color: '#4a4a4a', fontSize: '0.9rem' }}>No leads currently in sequence.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #181818' }}>
                {['Name', 'Step', 'Next SMS', 'Action'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a4a4a', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeLeads.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #181818' }}>
                  <td style={{ padding: '10px 12px', color: '#F5F5F5', fontSize: '0.85rem' }}>{l.full_name || 'Unknown'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#00CFFF' }}>Step {l.sms_step}</td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#999' }}>{l.next_sms_at ? new Date(l.next_sms_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button onClick={() => pauseLead(l.id)} style={{ padding: '4px 12px', background: '#202020', color: '#FFB800', border: '1px solid #181818', borderRadius: 1, cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>Pause</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
