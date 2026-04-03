'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const PHASES = [
  'Extracting business data...',
  'Generating SMS sequence...',
  'Creating AI agent...',
  'Building your page...',
  'Done! \u2713',
];

export default function OnboardingStep1() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [liveUrl, setLiveUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login');
    });
  }, [supabase, router]);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setCurrentPhase(0);
    setCompletedPhases([]);

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/funnel/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': session?.access_token || '',
        },
        body: JSON.stringify({ prompt }),
      });

      clearInterval(phaseInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();

      setCompletedPhases([0, 1, 2, 3]);
      setCurrentPhase(4);
      setCompletedPhases((cp) => [...cp, 4]);
      setLiveUrl(`https://goelev8.ai/f/${data.slug || 'your-slug'}`);
    } catch (err: any) {
      clearInterval(phaseInterval);
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setCurrentPhase(-1);
      setCompletedPhases([]);
    }
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      padding: '2rem',
    } as React.CSSProperties,
    container: {
      width: '100%',
      maxWidth: 640,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem',
    } as React.CSSProperties,
    stepRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    } as React.CSSProperties,
    stepText: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.85rem',
      color: '#999',
    } as React.CSSProperties,
    dot: (active: boolean) =>
      ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: active ? '#00CFFF' : '#4a4a4a',
        transition: 'background 0.2s',
      }) as React.CSSProperties,
    headline: {
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: '2.4rem',
      color: '#F5F5F5',
      lineHeight: 1.1,
      margin: 0,
    } as React.CSSProperties,
    sub: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.95rem',
      color: '#999',
      margin: 0,
    } as React.CSSProperties,
    textarea: {
      width: '100%',
      minHeight: 160,
      background: '#0e0e0e',
      border: '1px solid #202020',
      borderRadius: 1,
      color: '#F5F5F5',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1rem',
      padding: '1rem',
      resize: 'vertical' as const,
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    button: {
      padding: '0.85rem 2rem',
      background: '#00CFFF',
      color: '#000',
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: '1.2rem',
      border: 'none',
      borderRadius: 1,
      cursor: 'pointer',
      letterSpacing: '0.5px',
    } as React.CSSProperties,
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    } as React.CSSProperties,
    phaseRow: (done: boolean, active: boolean) =>
      ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.95rem',
        color: done ? '#00FF94' : active ? '#F5F5F5' : '#4a4a4a',
        transition: 'color 0.3s',
      }) as React.CSSProperties,
    spinner: {
      width: 16,
      height: 16,
      border: '2px solid #4a4a4a',
      borderTop: '2px solid #00CFFF',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    } as React.CSSProperties,
    urlBox: {
      background: 'rgba(0,207,255,0.08)',
      border: '1px solid #00CFFF',
      borderRadius: 1,
      padding: '1.25rem',
      textAlign: 'center' as const,
    } as React.CSSProperties,
    urlText: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '1.1rem',
      color: '#00CFFF',
      wordBreak: 'break-all' as const,
    } as React.CSSProperties,
    secondaryBtn: {
      padding: '0.7rem 1.5rem',
      background: 'transparent',
      color: '#00CFFF',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.95rem',
      border: '1px solid #00CFFF',
      borderRadius: 1,
      cursor: 'pointer',
    } as React.CSSProperties,
    link: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
      color: '#00CFFF',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: 0,
    } as React.CSSProperties,
    error: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
      color: '#ff4444',
    } as React.CSSProperties,
  };

  const isComplete = currentPhase === 4;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.stepRow}>
            <span style={styles.stepText}>Step 1 of 4</span>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={styles.dot(i === 0)} />
            ))}
          </div>

          <h1 style={styles.headline}>Describe your business. We build everything.</h1>
          <p style={styles.sub}>
            Your AI business page will be live at goelev8.ai/f/your-slug
          </p>

          {!loading && !isComplete && (
            <>
              <textarea
                style={styles.textarea}
                placeholder="Tell us about your business, what you sell, and who your customers are..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#00CFFF')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#202020')}
              />
              <button
                style={{
                  ...styles.button,
                  ...(!prompt.trim() ? styles.buttonDisabled : {}),
                }}
                onClick={handleSubmit}
                disabled={!prompt.trim()}
              >
                Build My Page &rarr;
              </button>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          {loading && !isComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PHASES.slice(0, -1).map((phase, i) => {
                const done = completedPhases.includes(i);
                const active = currentPhase === i;
                return (
                  <div key={i} style={styles.phaseRow(done, active)}>
                    {done ? (
                      <span style={{ color: '#00FF94', fontWeight: 700 }}>{'\u2713'}</span>
                    ) : active ? (
                      <div style={styles.spinner} />
                    ) : (
                      <span style={{ width: 16, display: 'inline-block' }}>&nbsp;</span>
                    )}
                    <span>{phase}</span>
                  </div>
                );
              })}
            </div>
          )}

          {isComplete && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {PHASES.map((phase, i) => (
                  <div key={i} style={styles.phaseRow(true, false)}>
                    <span style={{ color: i === 4 ? '#00FF94' : '#00FF94', fontWeight: 700 }}>
                      {'\u2713'}
                    </span>
                    <span>{phase}</span>
                  </div>
                ))}
              </div>

              <div style={styles.urlBox}>
                <p style={{ ...styles.sub, marginBottom: '0.5rem' }}>Your page is live at</p>
                <p style={styles.urlText}>{liveUrl}</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.secondaryBtn, textDecoration: 'none' }}
                >
                  View Your Page &rarr;
                </a>
                <button
                  style={styles.button}
                  onClick={() => router.push('/onboarding/funnel')}
                >
                  Continue to next step &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
