'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const C = {
  blk: '#000', card: '#0e0e0e', b1: '#181818', b2: '#202020',
  cyan: '#00CFFF', grn: '#00FF94', red: '#FF3B3B', amber: '#FFB800',
  wh: '#F5F5F5', wh2: '#999', mu: '#4a4a4a',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'UTC',
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    const hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    TIME_OPTIONS.push(`${hour}:${m} ${ampm}`);
  }
}

type DayConfig = { active: boolean; start: string; end: string };

const DEFAULT_DAY: DayConfig = { active: true, start: '9:00 AM', end: '5:00 PM' };
const DEFAULT_WEEKEND: DayConfig = { active: false, start: '9:00 AM', end: '5:00 PM' };

export default function CalendarPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [userId, setUserId] = useState('');

  const [days, setDays] = useState<DayConfig[]>(
    DAYS.map((_, i) => i < 5 ? { ...DEFAULT_DAY } : { ...DEFAULT_WEEKEND })
  );
  const [timezone, setTimezone] = useState('America/New_York');
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(10);

  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }
    setUserId(session.user.id);

    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (avail) {
      if (avail.days) setDays(avail.days);
      if (avail.timezone) setTimezone(avail.timezone);
      if (avail.duration) setDuration(avail.duration);
      if (avail.buffer !== undefined) setBuffer(avail.buffer);
    }

    const { data: integrations } = await supabase
      .from('calendar_integrations')
      .select('provider, connected')
      .eq('user_id', session.user.id);

    if (integrations) {
      const google = integrations.find(i => i.provider === 'google');
      if (google?.connected) setGoogleConnected(true);
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('availability')
      .upsert({
        user_id: userId,
        days,
        timezone,
        duration,
        buffer,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Availability saved.' });
    }
    setSaving(false);
  }

  function updateDay(index: number, field: keyof DayConfig, value: any) {
    setDays(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  }

  function connectGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const redirect = `${window.location.origin}/api/calendar/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    window.location.href = url;
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', background: C.b1, border: `1px solid ${C.b2}`,
    borderRadius: 1, color: C.wh, fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer', appearance: 'none' as any,
    WebkitAppearance: 'none' as any, paddingRight: 28,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23999'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.blk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.cyan, fontFamily: 'Bebas Neue, sans-serif', fontSize: 24 }}>Loading...</div>
    </div>
  );

  const integrations = [
    { name: 'Google Calendar', connected: googleConnected, action: connectGoogle },
    { name: 'Calendly', connected: false, comingSoon: true },
    { name: 'Acuity', connected: false, comingSoon: true },
    { name: 'Outlook', connected: false, comingSoon: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.blk, color: C.wh, fontFamily: 'DM Sans, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, color: C.wh, margin: '0 0 32px', letterSpacing: 1 }}>
          Calendar & Availability
        </h1>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 1, marginBottom: 24,
            background: message.type === 'error' ? 'rgba(255,59,59,0.1)' : 'rgba(0,255,148,0.1)',
            border: `1px solid ${message.type === 'error' ? C.red : C.grn}`,
            color: message.type === 'error' ? C.red : C.grn, fontSize: 14,
          }}>
            {message.text}
          </div>
        )}

        {/* Availability */}
        <div style={{ background: C.card, border: `1px solid ${C.b2}`, borderRadius: 1, padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: C.wh, margin: '0 0 20px' }}>Availability</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {DAYS.map((day, i) => (
              <div key={day} style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                padding: '12px 16px', background: C.b1, borderRadius: 1,
                border: `1px solid ${C.b2}`, opacity: days[i].active ? 1 : 0.5,
              }}>
                <button
                  onClick={() => updateDay(i, 'active', !days[i].active)}
                  style={{
                    width: 40, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: days[i].active ? C.cyan : C.mu,
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: days[i].active ? 19 : 3, transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ width: 90, fontSize: 14, color: C.wh, fontWeight: 600 }}>{day}</span>
                {days[i].active && (
                  <>
                    <select
                      value={days[i].start}
                      onChange={e => updateDay(i, 'start', e.target.value)}
                      style={selectStyle}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: C.wh2, fontSize: 13 }}>to</span>
                    <select
                      value={days[i].end}
                      onChange={e => updateDay(i, 'end', e.target.value)}
                      style={selectStyle}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Settings row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', color: C.wh2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: C.wh2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Appointment Duration</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ ...selectStyle, width: '100%' }}>
                {[15, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: C.wh2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Buffer Time</label>
              <select value={buffer} onChange={e => setBuffer(Number(e.target.value))} style={{ ...selectStyle, width: '100%' }}>
                {[0, 10, 15, 30].map(b => <option key={b} value={b}>{b === 0 ? 'None' : `${b} min`}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            padding: '12px 32px', background: C.cyan, color: C.blk, border: 'none',
            borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>

        {/* Calendar Integrations */}
        <div style={{ background: C.card, border: `1px solid ${C.b2}`, borderRadius: 1, padding: 28 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: C.wh, margin: '0 0 20px' }}>Calendar Integrations</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {integrations.map(integ => (
              <div key={integ.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', background: C.b1, borderRadius: 1, border: `1px solid ${C.b2}`,
              }}>
                <span style={{ fontSize: 15, color: C.wh, fontWeight: 600 }}>{integ.name}</span>
                {integ.connected ? (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                    background: 'rgba(0,255,148,0.12)', color: C.grn,
                    padding: '4px 12px', borderRadius: 1,
                  }}>
                    Connected
                  </span>
                ) : integ.comingSoon ? (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                    color: C.wh2, padding: '4px 12px',
                  }}>
                    Coming soon
                  </span>
                ) : (
                  <button onClick={integ.action} style={{
                    padding: '6px 20px', background: 'transparent', color: C.cyan,
                    border: `1px solid ${C.cyan}`, borderRadius: 1,
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Connect
                  </button>
                )}
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
