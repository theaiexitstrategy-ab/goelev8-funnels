'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const cardStyle: React.CSSProperties = { background: '#0e0e0e', border: '1px solid #181818', borderRadius: 1, padding: 24, marginBottom: 20 };
const inputStyle: React.CSSProperties = { width: '100%', padding: 12, background: '#202020', border: '1px solid #181818', color: '#F5F5F5', borderRadius: 1, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' };

export default function SMSBlastPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState('');
  const [segment, setSegment] = useState('all');
  const [aiPrompt, setAiPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  const [blasts, setBlasts] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData);
      const { data: f } = await supabase.from('funnels').select('*').eq('user_id', session.user.id).eq('is_active', true);
      setFunnels(f || []);
      if (f?.[0]) setSelectedFunnel(f[0].id);
      // Load blast history
      const { data: b } = await supabase.from('sms_blasts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20);
      setBlasts(b || []);
    })();
  }, []);

  // Count recipients when funnel/segment changes
  useEffect(() => {
    if (!selectedFunnel || !user) return;
    (async () => {
      let query = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('funnel_id', selectedFunnel).eq('user_id', user.id);
      if (segment === 'active') query = query.eq('status', 'sms_sequence');
      else if (segment === 'booked') query = query.eq('status', 'booked');
      else if (segment === 'stale') query = query.lte('updated_at', new Date(Date.now() - 14 * 86400000).toISOString());
      const { count } = await query;
      setRecipientCount(count || 0);
    })();
  }, [selectedFunnel, segment, user]);

  const generateCopy = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const funnel = funnels.find(f => f.id === selectedFunnel);
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnel_slug: funnel?.slug, message: `Write a promotional SMS (under 160 chars) for: ${aiPrompt}` }),
      });
      const data = await res.json();
      if (data.reply) setMessage(data.reply.slice(0, 160));
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const sendBlast = async () => {
    if (!message || !selectedFunnel) return;
    if (!confirm(`Send "${message.slice(0, 40)}..." to ${recipientCount} leads? This will use ${recipientCount} SMS credits.`)) return;
    setSending(true); setMsg('');
    const { data: blast } = await supabase.from('sms_blasts').insert({
      user_id: user.id, funnel_id: selectedFunnel, segment, body: message,
      recipient_count: recipientCount, status: 'sending',
    }).select().single();
    if (blast) {
      await supabase.functions.invoke('send-blast', { body: { blast_id: blast.id } });
      setMsg('Blast sent!');
      setBlasts([blast, ...blasts]);
    }
    setSending(false); setMessage(''); setAiPrompt('');
  };

  // Upgrade gate for Launch/Trial
  if (user && (user.tier === 'trial' || user.tier === 'launch')) {
    return (
      <div style={{ position: 'relative' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: '#F5F5F5', margin: '0 0 24px' }}>SMS Blast Center</h1>
        <div style={{ filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.3 }}>
          <div style={cardStyle}><p style={{ color: '#999' }}>Blast composer content...</p></div>
          <div style={cardStyle}><p style={{ color: '#999' }}>Campaign history...</p></div>
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', background: '#0e0e0e', border: '1px solid #00CFFF', borderRadius: 1, padding: '40px 48px', zIndex: 10 }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: '#F5F5F5', margin: '0 0 12px' }}>Upgrade to Grow to unlock SMS Blasts</p>
          <p style={{ color: '#999', margin: '0 0 20px', fontSize: '0.9rem' }}>Send targeted messages to your leads at scale.</p>
          <a href="/portal/settings/billing" style={{ padding: '12px 32px', background: '#00CFFF', color: '#000', border: 'none', borderRadius: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', textDecoration: 'none' }}>Upgrade →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: '#F5F5F5', margin: '0 0 24px' }}>SMS Blast Center</h1>

      {msg && <p style={{ color: '#00FF94', fontSize: '0.9rem', marginBottom: 16 }}>{msg}</p>}

      {/* Composer */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#F5F5F5', margin: '0 0 16px' }}>Compose Blast</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Funnel</label>
            <select value={selectedFunnel} onChange={e => setSelectedFunnel(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              {funnels.map(f => <option key={f.id} value={f.id}>{f.business_name || f.slug}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Segment</label>
            <select value={segment} onChange={e => setSegment(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="all">All Leads</option>
              <option value="active">Active Sequences</option>
              <option value="booked">Booked</option>
              <option value="stale">Stale (14+ days)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>AI Prompt (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe what you want to promote..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={generateCopy} disabled={generating} style={{ padding: '0 16px', background: '#202020', color: '#00CFFF', border: '1px solid #181818', borderRadius: 1, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{generating ? '...' : 'Generate'}</button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#999', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 160))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} maxLength={160} placeholder="Type or generate your message..." />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: message.length > 160 ? '#FF3B3B' : '#4a4a4a' }}>{message.length}/160</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #181818', marginBottom: 16 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#999' }}>{recipientCount} recipients × 1 credit = {recipientCount} credits</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: (user?.sms_credits || 0) < recipientCount ? '#FF3B3B' : '#00FF94' }}>Balance: {user?.sms_credits || 0} credits</span>
        </div>

        <button onClick={sendBlast} disabled={sending || !message || recipientCount === 0} style={{ width: '100%', padding: '14px', background: '#00CFFF', color: '#000', border: 'none', borderRadius: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', cursor: 'pointer', opacity: !message || recipientCount === 0 ? 0.5 : 1 }}>
          {sending ? 'Sending...' : 'Send Blast'}
        </button>
      </div>

      {/* Campaign History */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#F5F5F5', margin: '0 0 16px' }}>Campaign History</h2>
        {blasts.length === 0 ? (
          <p style={{ color: '#4a4a4a', fontSize: '0.9rem' }}>No campaigns yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #181818' }}>
                  {['Message', 'Segment', 'Sent', 'Credits', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#4a4a4a', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blasts.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #181818' }}>
                    <td style={{ padding: '10px 12px', color: '#F5F5F5', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.body}</td>
                    <td style={{ padding: '10px 12px', color: '#999', fontSize: '0.85rem' }}>{b.segment}</td>
                    <td style={{ padding: '10px 12px', color: '#999', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.sent_count || 0}</td>
                    <td style={{ padding: '10px 12px', color: '#999', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.credits_used || 0}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', padding: '2px 8px', borderRadius: 1, background: b.status === 'sent' ? '#00FF9420' : b.status === 'failed' ? '#FF3B3B20' : '#00CFFF20', color: b.status === 'sent' ? '#00FF94' : b.status === 'failed' ? '#FF3B3B' : '#00CFFF' }}>
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4a4a4a', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>{b.sent_at ? new Date(b.sent_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
