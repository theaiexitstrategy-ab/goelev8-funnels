'use client';
// app/portal/funnels/[id]/page.tsx — Funnel editor
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Funnel {
  id: string;
  slug: string;
  business_name: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  offer: string;
  sms_day0: string;
  sms_day1: string;
  sms_day3: string;
  sms_day7: string;
  sms_day14: string;
  sms_enabled: boolean;
  ai_agent_enabled: boolean;
  vapi_assistant_id: string | null;
  chat_widget_enabled: boolean;
  store_enabled: boolean;
  is_active: boolean;
  user_id: string;
  prompt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SMS_FIELDS: { key: string; label: string }[] = [
  { key: 'sms_day0', label: 'Day 0 (Immediate)' },
  { key: 'sms_day1', label: 'Day 1' },
  { key: 'sms_day3', label: 'Day 3' },
  { key: 'sms_day7', label: 'Day 7' },
  { key: 'sms_day14', label: 'Day 14' },
];

const PHASES = [
  'Extracting business data...',
  'Generating SMS sequence...',
  'Creating AI agent...',
  'Building your page...',
  'Done!',
];

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    color: '#F5F5F5',
    maxWidth: 720,
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '2rem',
    color: '#F5F5F5',
    margin: 0,
    letterSpacing: 1,
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '1.3rem',
    color: '#F5F5F5',
    margin: '0 0 16px',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  section: {
    background: '#0e0e0e',
    border: '1px solid #181818',
    borderRadius: 1,
    padding: 24,
    marginBottom: 24,
  } as React.CSSProperties,
  urlBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#00CFFF10',
    border: '1px solid #00CFFF',
    borderRadius: 1,
    padding: '10px 16px',
    marginBottom: 28,
  } as React.CSSProperties,
  urlText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: '#00CFFF',
    flex: 1,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 500,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: '#181818',
    border: '1px solid #202020',
    borderRadius: 1,
    color: '#F5F5F5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 16,
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    background: '#181818',
    border: '1px solid #202020',
    borderRadius: 1,
    color: '#F5F5F5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    lineHeight: 1.5,
  } as React.CSSProperties,
  charCount: (len: number) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: len > 160 ? '#FF3B3B' : '#4a4a4a',
    textAlign: 'right' as const,
    marginTop: 4,
    marginBottom: 16,
  }) as React.CSSProperties,
  btnCyan: {
    padding: '10px 22px',
    background: '#00CFFF',
    color: '#000',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 14,
    border: 'none',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  btnOutline: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#999',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    border: '1px solid #202020',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnRed: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#FF3B3B',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    border: '1px solid #FF3B3B',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnAmber: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#FFB800',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    border: '1px solid #FFB800',
    borderRadius: 1,
    cursor: 'pointer',
  } as React.CSSProperties,
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #181818',
  } as React.CSSProperties,
  toggleLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#F5F5F5',
  } as React.CSSProperties,
  toggleTierTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#4a4a4a',
    marginLeft: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as React.CSSProperties,
  toggle: (on: boolean, disabled: boolean) => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    background: disabled ? '#181818' : on ? '#00CFFF' : '#202020',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative' as const,
    transition: 'background 0.2s',
    flexShrink: 0,
  }) as React.CSSProperties,
  toggleKnob: (on: boolean) => ({
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: on ? '#000' : '#4a4a4a',
    position: 'absolute' as const,
    top: 3,
    left: on ? 21 : 3,
    transition: 'left 0.2s',
  }) as React.CSSProperties,
  dangerZone: {
    background: '#0e0e0e',
    border: '1px solid #FF3B3B30',
    borderRadius: 1,
    padding: 24,
    marginBottom: 24,
  } as React.CSSProperties,
  saved: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: '#00FF94',
    marginLeft: 12,
  } as React.CSSProperties,
  progressBox: {
    marginTop: 16,
    background: '#181818',
    borderRadius: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as React.CSSProperties,
  phaseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
  } as React.CSSProperties,
  phaseDot: (state: 'done' | 'active' | 'pending') => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    background:
      state === 'done' ? '#00FF94' : state === 'active' ? '#00CFFF' : '#202020',
    ...(state === 'active' ? { animation: 'pulse 1.2s ease-in-out infinite' } : {}),
  }) as React.CSSProperties,
  phaseText: (state: 'done' | 'active' | 'pending') => ({
    color:
      state === 'done' ? '#00FF94' : state === 'active' ? '#F5F5F5' : '#4a4a4a',
  }) as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FunnelEditorPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const funnelId = params.id as string;

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [tier, setTier] = useState('launch');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* Editable fields */
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [offer, setOffer] = useState('');
  const [smsFields, setSmsFields] = useState<Record<string, string>>({});
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [aiAgentEnabled, setAiAgentEnabled] = useState(false);
  const [chatWidgetEnabled, setChatWidgetEnabled] = useState(false);
  const [storeEnabled, setStoreEnabled] = useState(false);

  /* UI state */
  const [copySaved, setCopySaved] = useState(false);
  const [smsSaved, setSmsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenPhase, setRegenPhase] = useState(-1);
  const [regenCompleted, setRegenCompleted] = useState<number[]>([]);

  /* ---------------------------------------------------------------- */
  /*  Load funnel                                                      */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const uid = session.user.id;

      const [funnelRes, userRes] = await Promise.all([
        supabase.from('funnels').select('*').eq('id', funnelId).eq('user_id', uid).single(),
        supabase.from('users').select('tier').eq('id', uid).single(),
      ]);

      if (!funnelRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const f = funnelRes.data as Funnel;
      setFunnel(f);
      setTier(userRes.data?.tier || 'launch');

      setHeadline(f.headline || '');
      setSubheadline(f.subheadline || '');
      setCtaText(f.cta_text || '');
      setOffer(f.offer || '');
      setSmsFields({
        sms_day0: f.sms_day0 || '',
        sms_day1: f.sms_day1 || '',
        sms_day3: f.sms_day3 || '',
        sms_day7: f.sms_day7 || '',
        sms_day14: f.sms_day14 || '',
      });
      setSmsEnabled(f.sms_enabled ?? false);
      setAiAgentEnabled(f.ai_agent_enabled ?? !!f.vapi_assistant_id);
      setChatWidgetEnabled(f.chat_widget_enabled ?? false);
      setStoreEnabled(f.store_enabled ?? false);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnelId]);

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const saveCopy = async () => {
    if (!funnel) return;
    await supabase
      .from('funnels')
      .update({ headline, subheadline, cta_text: ctaText, offer })
      .eq('id', funnel.id);
    setCopySaved(true);
    setTimeout(() => setCopySaved(false), 2000);
  };

  const saveSms = async () => {
    if (!funnel) return;
    await supabase.from('funnels').update({
      sms_day0: smsFields.sms_day0,
      sms_day1: smsFields.sms_day1,
      sms_day3: smsFields.sms_day3,
      sms_day7: smsFields.sms_day7,
      sms_day14: smsFields.sms_day14,
    }).eq('id', funnel.id);
    setSmsSaved(true);
    setTimeout(() => setSmsSaved(false), 2000);
  };

  const toggleSetting = async (field: string, value: boolean) => {
    if (!funnel) return;
    await supabase.from('funnels').update({ [field]: value }).eq('id', funnel.id);
  };

  const deactivate = async () => {
    if (!funnel) return;
    if (!confirm('Deactivate this funnel? It will no longer be publicly visible.')) return;
    await supabase.from('funnels').update({ is_active: false }).eq('id', funnel.id);
    setFunnel({ ...funnel, is_active: false });
  };

  const regenerate = async () => {
    if (!funnel || regenerating) return;
    if (!confirm('Regenerate this funnel? This will overwrite the current page copy and SMS sequence.')) return;
    setRegenerating(true);
    setRegenPhase(0);
    setRegenCompleted([]);

    const phaseInterval = setInterval(() => {
      setRegenPhase((prev) => {
        if (prev < 3) {
          setRegenCompleted((cp) => [...cp, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/funnel/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': session?.access_token || '',
        },
        body: JSON.stringify({ prompt: funnel.prompt, funnel_id: funnel.id }),
      });

      clearInterval(phaseInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Regeneration failed');
      }

      setRegenCompleted([0, 1, 2, 3, 4]);
      setRegenPhase(4);

      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      clearInterval(phaseInterval);
      alert(err.message);
      setRegenerating(false);
      setRegenPhase(-1);
      setRegenCompleted([]);
    }
  };

  const copyUrl = () => {
    if (!funnel) return;
    navigator.clipboard.writeText(`https://goelev8.ai/f/${funnel.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRegenState = (i: number): 'done' | 'active' | 'pending' => {
    if (regenCompleted.includes(i)) return 'done';
    if (i === regenPhase) return 'active';
    return 'pending';
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#999', fontSize: 14, padding: 32 }}>
        Loading funnel...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#FF3B3B', fontSize: 14, padding: 32 }}>
        Funnel not found or access denied.
      </div>
    );
  }

  if (!funnel) return null;

  const tierNum = { launch: 0, grow: 1, scale: 2, white_label: 3 }[tier] ?? 0;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      <h1 style={s.title}>{funnel.business_name}</h1>

      {/* Live URL box */}
      <div style={s.urlBox}>
        <span style={s.urlText}>https://goelev8.ai/f/{funnel.slug}</span>
        <button style={s.btnOutline} onClick={copyUrl}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* ---- Section 1: Page Copy ---- */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Page Copy</h2>

        <label style={s.label}>Headline</label>
        <input
          style={s.input}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Main headline..."
        />

        <label style={s.label}>Subheadline</label>
        <textarea
          style={{ ...s.textarea, minHeight: 80, marginBottom: 16 }}
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          placeholder="Supporting text..."
        />

        <label style={s.label}>CTA Text</label>
        <input
          style={s.input}
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          placeholder="Button text..."
        />

        <label style={s.label}>Offer</label>
        <textarea
          style={{ ...s.textarea, minHeight: 80, marginBottom: 16 }}
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Describe the offer..."
        />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={s.btnCyan} onClick={saveCopy}>Save Changes</button>
          {copySaved && <span style={s.saved}>Saved</span>}
        </div>
      </div>

      {/* ---- Section 2: SMS Sequence ---- */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>SMS Sequence</h2>

        {SMS_FIELDS.map(({ key, label }) => {
          const val = smsFields[key] || '';
          return (
            <div key={key}>
              <label style={s.label}>{label}</label>
              <textarea
                style={{ ...s.textarea, minHeight: 64 }}
                value={val}
                onChange={(e) =>
                  setSmsFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={`SMS message for ${label}...`}
                maxLength={160}
              />
              <div style={s.charCount(val.length)}>{val.length}/160</div>
            </div>
          );
        })}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={s.btnCyan} onClick={saveSms}>Save SMS</button>
          {smsSaved && <span style={s.saved}>Saved</span>}
        </div>
      </div>

      {/* ---- Section 3: Settings ---- */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Settings</h2>

        {/* SMS Enabled */}
        <div style={s.toggleRow}>
          <span style={s.toggleLabel}>SMS Enabled</span>
          <button
            style={s.toggle(smsEnabled, false)}
            onClick={() => {
              const next = !smsEnabled;
              setSmsEnabled(next);
              toggleSetting('sms_enabled', next);
            }}
          >
            <div style={s.toggleKnob(smsEnabled)} />
          </button>
        </div>

        {/* AI Agent */}
        <div style={s.toggleRow}>
          <span style={s.toggleLabel}>
            AI Agent Enabled
            {tierNum < 1 && <span style={s.toggleTierTag}>Grow+</span>}
          </span>
          <button
            style={s.toggle(aiAgentEnabled, tierNum < 1)}
            onClick={() => {
              if (tierNum < 1) return;
              const next = !aiAgentEnabled;
              setAiAgentEnabled(next);
              toggleSetting('ai_agent_enabled', next);
            }}
          >
            <div style={s.toggleKnob(aiAgentEnabled)} />
          </button>
        </div>

        {/* Chat Widget */}
        <div style={s.toggleRow}>
          <span style={s.toggleLabel}>Chat Widget Enabled</span>
          <button
            style={s.toggle(chatWidgetEnabled, false)}
            onClick={() => {
              const next = !chatWidgetEnabled;
              setChatWidgetEnabled(next);
              toggleSetting('chat_widget_enabled', next);
            }}
          >
            <div style={s.toggleKnob(chatWidgetEnabled)} />
          </button>
        </div>

        {/* Store */}
        <div style={{ ...s.toggleRow, borderBottom: 'none' }}>
          <span style={s.toggleLabel}>
            Store Enabled
            {tierNum < 2 && <span style={s.toggleTierTag}>Scale+</span>}
          </span>
          <button
            style={s.toggle(storeEnabled, tierNum < 2)}
            onClick={() => {
              if (tierNum < 2) return;
              const next = !storeEnabled;
              setStoreEnabled(next);
              toggleSetting('store_enabled', next);
            }}
          >
            <div style={s.toggleKnob(storeEnabled)} />
          </button>
        </div>
      </div>

      {/* ---- Section 4: Danger Zone ---- */}
      <div style={s.dangerZone}>
        <h2 style={{ ...s.sectionTitle, color: '#FF3B3B' }}>Danger Zone</h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            style={{
              ...s.btnRed,
              opacity: funnel.is_active ? 1 : 0.4,
              cursor: funnel.is_active ? 'pointer' : 'not-allowed',
            }}
            onClick={deactivate}
            disabled={!funnel.is_active}
          >
            {funnel.is_active ? 'Deactivate Funnel' : 'Already Inactive'}
          </button>

          <button
            style={{
              ...s.btnAmber,
              opacity: regenerating ? 0.5 : 1,
              cursor: regenerating ? 'not-allowed' : 'pointer',
            }}
            onClick={regenerate}
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Page'}
          </button>
        </div>

        {/* Regen progress */}
        {regenPhase >= 0 && (
          <div style={s.progressBox}>
            {PHASES.map((label, i) => {
              const state = getRegenState(i);
              return (
                <div key={i} style={s.phaseRow}>
                  <div style={s.phaseDot(state)} />
                  <span style={s.phaseText(state)}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
