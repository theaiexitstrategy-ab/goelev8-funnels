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

const cardStyle: React.CSSProperties = { background: C.card, border: `1px solid ${C.b1}`, borderRadius: 1, padding: 24, marginBottom: 20 };
const inputStyle: React.CSSProperties = { width: '100%', padding: 12, background: C.b2, border: `1px solid ${C.b1}`, color: C.wh, borderRadius: 1, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' };

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SENT: { bg: 'rgba(0,255,148,0.12)', color: C.grn },
  SENDING: { bg: 'rgba(0,207,255,0.12)', color: C.cyan },
  FAILED: { bg: 'rgba(255,59,59,0.12)', color: C.red },
  SCHEDULED: { bg: 'rgba(255,184,0,0.12)', color: C.amber },
};

const SEGMENTS = [
  { id: 'all', label: 'All Leads' },
  { id: 'active', label: 'Active Sequences' },
  { id: 'booked', label: 'Booked' },
  { id: 'stale', label: 'Stale (14+ days)' },
];

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
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData);
      const { data: f } = await supabase.from('funnels').select('*').eq('user_id', session.user.id).eq('is_active', true);
      setFunnels(f || []);
      if (f?.[0]) setSelectedFunnel(f[0].id);
      const { data: b } = await supabase.from('sms_blasts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50);
      setBlasts(b || []);
    })();
  }, []);

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
        body: JSON.stringify({
          funnel_slug: funnel?.slug,
          message: `Write a short SMS marketing message (under 160 characters) for the following promotion: ${aiPrompt}. Use [Name] as a placeholder for the recipient's name. Be concise and include a clear call to action.`,
          system: 'You are an SMS copywriter. Output ONLY the SMS message text, nothing else.',
        }),
      });
      const data = await res.json();
      if (data.reply) setMessage(data.reply.trim().slice(0, 160));
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const handleSendBlast = async () => {
    if (!message || !selectedFunnel) return;
    setSending(true);
    setShowConfirm(false);
    setMsg('');
    try {
      const payload: any = {
        user_id: user.id,
        funnel_id: selectedFunnel,
        segment,
        body: message,
        message,
        recipient_count: recipientCount,
        credits_used: recipientCount,
        status: sendMode === 'schedule' ? 'SCHEDULED' : 'SENDING',
      };
      if (sendMode === 'schedule' && scheduleDate) {
        payload.scheduled_at = new Date(scheduleDate).toISOString();
      }
      const { data: blast, error } = await supabase.from('sms_blasts').insert(payload).select().single();
      if (error) throw error;
      if (sendMode === 'now' && blast) {
        await supabase.functions.invoke('send-blast', { body: { blast_id: blast.id } });
      }
      setMsg(sendMode === 'schedule' ? 'Blast scheduled.' : 'Blast sent!');
      if (blast) setBlasts([blast, ...blasts]);
      setMessage('');
      setAiPrompt('');
    } catch {
      setMsg('Failed to send blast.');
    }
    setSending(false);
  };

  // Upgrade gate for Launch/Trial
  if (user && (user.tier === 'trial' || user.tier === 'launch')) {
    return (
      <div style={{ position: 'relative' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: C.wh, margin: '0 0 24px' }}>SMS Blast Center</h1>
        <div style={{ filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.3 }}>
          <div style={cardStyle}><p style={{ color: C.wh2 }}>Blast composer content...</p></div>
          <div style={cardStyle}><p style={{ color: C.wh2 }}>Campaign history...</p></div>
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', background: C.card, border: `1px solid ${C.cyan}`, borderRadius: 1, padding: '40px 48px', zIndex: 10 }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: C.wh, margin: '0 0 12px' }}>Upgrade to Grow to unlock SMS Blasts</p>
          <p style={{ color: C.wh2, margin: '0 0 20px', fontSize: '0.9rem' }}>Send targeted messages to your leads at scale.</p>
          <a href="/portal/settings/billing" style={{ display: 'inline-block', padding: '12px 32px', background: C.cyan, color: C.blk, border: 'none', borderRadius: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', textDecoration: 'none', fontWeight: 700 }}>Upgrade &rarr;</a>
        </div>
      </div>
    );
  }

  const charCount = message.length;
  const creditCost = recipientCount;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: C.wh, margin: '0 0 24px' }}>SMS Blast Center</h1>

      {msg && <p style={{ color: msg.includes('Failed') ? C.red : C.grn, fontSize: '0.9rem', marginBottom: 16 }}>{msg}</p>}

      {/* Composer */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: C.wh, margin: '0 0 16px' }}>Blast Composer</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', color: C.wh2, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Funnel</label>
            <select value={selectedFunnel} onChange={e => setSelectedFunnel(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              {funnels.map(f => <option key={f.id} value={f.id}>{f.business_name || f.slug}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: C.wh2, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Segment</label>
            <select value={segment} onChange={e => setSegment(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* AI Prompt */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: C.wh2, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>AI Prompt</label>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Describe what you want to promote..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
          <button onClick={generateCopy} disabled={generating || !aiPrompt.trim()} style={{
            marginTop: 8, padding: '8px 20px', background: 'transparent', color: C.cyan,
            border: `1px solid ${C.cyan}`, borderRadius: 1, fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            opacity: generating || !aiPrompt.trim() ? 0.5 : 1,
          }}>
            {generating ? 'Generating...' : 'Generate Copy'}
          </button>
        </div>

        {/* Message editor */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: C.wh2, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', marginBottom: 6 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Your SMS message..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: charCount > 160 ? C.red : C.mu }}>
              {charCount}/160
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 16px', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}` }}>
            <span style={{ color: C.wh2, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>Recipients</span>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: C.cyan }}>{recipientCount}</div>
            <span style={{ color: C.wh2, fontSize: '0.7rem' }}>leads in segment</span>
          </div>
          <div style={{ padding: '10px 16px', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}` }}>
            <span style={{ color: C.wh2, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>Credit Cost</span>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: C.amber }}>{creditCost}</div>
            <span style={{ color: C.wh2, fontSize: '0.7rem' }}>credits will be used</span>
          </div>
          <div style={{ padding: '10px 16px', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}` }}>
            <span style={{ color: C.wh2, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>Balance</span>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: C.grn }}>{user?.sms_credits ?? 0}</div>
            <span style={{ color: C.wh2, fontSize: '0.7rem' }}>credits remaining</span>
          </div>
        </div>

        {/* Schedule toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}`, overflow: 'hidden' }}>
            {(['now', 'schedule'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSendMode(mode)}
                style={{
                  padding: '8px 20px', border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 600,
                  background: sendMode === mode ? C.cyan : 'transparent',
                  color: sendMode === mode ? C.blk : C.wh2,
                }}
              >
                {mode === 'now' ? 'Send Now' : 'Schedule'}
              </button>
            ))}
          </div>
          {sendMode === 'schedule' && (
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              style={{ ...inputStyle, width: 'auto', colorScheme: 'dark' }}
            />
          )}
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={!message.trim() || !selectedFunnel || recipientCount === 0}
          style={{
            width: '100%', padding: 14, background: C.cyan, color: C.blk, border: 'none',
            borderRadius: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem',
            cursor: 'pointer', opacity: !message.trim() || recipientCount === 0 ? 0.4 : 1,
          }}
        >
          Send Blast
        </button>
      </div>

      {/* Campaign History */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: C.wh, margin: '0 0 16px' }}>Campaign History</h2>
        {blasts.length === 0 ? (
          <p style={{ color: C.mu, fontSize: '0.9rem' }}>No campaigns yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.b1}` }}>
                  {['Message', 'Segment', 'Recipients', 'Sent', 'Credits', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: C.mu, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blasts.map(b => {
                  const statusKey = (b.status || '').toUpperCase();
                  const st = STATUS_COLORS[statusKey] || STATUS_COLORS.SENT;
                  return (
                    <tr key={b.id} style={{ borderBottom: `1px solid ${C.b1}` }}>
                      <td style={{ padding: '10px 12px', color: C.wh, fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(b.body || b.message || '').substring(0, 50)}{(b.body || b.message || '').length > 50 ? '...' : ''}</td>
                      <td style={{ padding: '10px 12px', color: C.wh2, fontSize: '0.85rem' }}>{b.segment}</td>
                      <td style={{ padding: '10px 12px', color: C.wh, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.recipient_count || 0}</td>
                      <td style={{ padding: '10px 12px', color: C.wh2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.sent_count ?? '-'}</td>
                      <td style={{ padding: '10px 12px', color: C.amber, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.credits_used || 0}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
                          padding: '2px 8px', borderRadius: 1,
                          background: st.bg, color: st.color,
                        }}>
                          {statusKey}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: C.mu, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ color: C.mu, fontSize: 12, textAlign: 'center', marginTop: 48 }}>
        &copy; 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
      </p>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.card, border: `1px solid ${C.b2}`, borderRadius: 1, padding: 32, maxWidth: 440, width: '90%' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: C.cyan, margin: '0 0 12px' }}>
              Confirm {sendMode === 'schedule' ? 'Schedule' : 'Send'}
            </h3>
            <p style={{ color: C.wh2, fontSize: 14, margin: '0 0 8px', lineHeight: 1.6 }}>
              This will {sendMode === 'schedule' ? 'schedule' : 'send'} <strong style={{ color: C.wh }}>{recipientCount}</strong> messages using <strong style={{ color: C.amber }}>{creditCost} credits</strong>.
            </p>
            {sendMode === 'schedule' && scheduleDate && (
              <p style={{ color: C.wh2, fontSize: 13, margin: '0 0 8px' }}>
                Scheduled for: {new Date(scheduleDate).toLocaleString()}
              </p>
            )}
            <div style={{ background: C.b1, borderRadius: 1, padding: 12, marginBottom: 20, border: `1px solid ${C.b2}` }}>
              <p style={{ color: C.wh, fontSize: 13, margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>{message}</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSendBlast}
                disabled={sending}
                style={{
                  flex: 1, padding: 12, background: C.cyan, color: C.blk, border: 'none',
                  borderRadius: 1, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: 12, background: 'transparent', color: C.wh2,
                  border: `1px solid ${C.mu}`, borderRadius: 1, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
