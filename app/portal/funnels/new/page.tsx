'use client';
// app/portal/funnels/new/page.tsx — New funnel creation
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
    maxWidth: 640,
  } as React.CSSProperties,
  title: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: '2rem',
    color: '#F5F5F5',
    margin: '0 0 8px',
    letterSpacing: 1,
  } as React.CSSProperties,
  subtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#999',
    margin: '0 0 24px',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: 160,
    background: '#0e0e0e',
    border: '1px solid #181818',
    borderRadius: 1,
    color: '#F5F5F5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '14px 16px',
    resize: 'vertical' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
    lineHeight: 1.6,
  } as React.CSSProperties,
  btnCyan: {
    marginTop: 16,
    padding: '12px 28px',
    background: '#00CFFF',
    color: '#000',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 16,
    border: 'none',
    borderRadius: 1,
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  btnDisabled: {
    marginTop: 16,
    padding: '12px 28px',
    background: '#181818',
    color: '#4a4a4a',
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 16,
    border: 'none',
    borderRadius: 1,
    cursor: 'not-allowed',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  progressBox: {
    marginTop: 32,
    background: '#0e0e0e',
    border: '1px solid #181818',
    borderRadius: 1,
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  } as React.CSSProperties,
  phaseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  } as React.CSSProperties,
  dot: (state: 'done' | 'active' | 'pending') => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    background:
      state === 'done' ? '#00FF94' : state === 'active' ? '#00CFFF' : '#202020',
    ...(state === 'active'
      ? { animation: 'pulse 1.2s ease-in-out infinite' }
      : {}),
  }) as React.CSSProperties,
  phaseText: (state: 'done' | 'active' | 'pending') => ({
    color:
      state === 'done' ? '#00FF94' : state === 'active' ? '#F5F5F5' : '#4a4a4a',
  }) as React.CSSProperties,
  error: {
    marginTop: 16,
    padding: '12px 16px',
    background: '#FF3B3B18',
    border: '1px solid #FF3B3B',
    borderRadius: 1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#FF3B3B',
  } as React.CSSProperties,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewFunnelPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setCurrentPhase(0);
    setCompletedPhases([]);

    /* Animate progress phases */
    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev < 3) {
          setCompletedPhases((cp) => [...cp, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/funnel/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': session.access_token || '',
        },
        body: JSON.stringify({ prompt }),
      });

      clearInterval(phaseInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();

      /* Show completed state */
      setCompletedPhases([0, 1, 2, 3]);
      setCurrentPhase(4);
      setCompletedPhases((cp) => [...cp, 4]);

      /* Redirect to editor after brief pause */
      setTimeout(() => {
        router.push(`/portal/funnels/${data.funnel_id || data.id}`);
      }, 1200);
    } catch (err: any) {
      clearInterval(phaseInterval);
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setCurrentPhase(-1);
      setCompletedPhases([]);
    }
  };

  const getPhaseState = (i: number): 'done' | 'active' | 'pending' => {
    if (completedPhases.includes(i)) return 'done';
    if (i === currentPhase) return 'active';
    return 'pending';
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      <h1 style={s.title}>Build a New Funnel</h1>
      <p style={s.subtitle}>
        Describe the business and we will generate a full landing page, SMS sequence, and AI agent.
      </p>

      <textarea
        style={{
          ...s.textarea,
          borderColor: loading ? '#181818' : undefined,
        }}
        placeholder="Describe the business... e.g. &quot;Mobile auto detailing in Dallas, TX. We offer ceramic coating, paint correction, and interior cleaning. Target audience: car enthusiasts and busy professionals.&quot;"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
        onFocus={(e) => {
          if (!loading) e.currentTarget.style.borderColor = '#00CFFF';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#181818';
        }}
      />

      <button
        style={!prompt.trim() || loading ? s.btnDisabled : s.btnCyan}
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
      >
        {loading ? 'Generating...' : 'Generate Funnel \u2192'}
      </button>

      {error && <div style={s.error}>{error}</div>}

      {/* Progress */}
      {currentPhase >= 0 && (
        <div style={s.progressBox}>
          {PHASES.map((label, i) => {
            const state = getPhaseState(i);
            return (
              <div key={i} style={s.phaseRow}>
                <div style={s.dot(state)} />
                <span style={s.phaseText(state)}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
