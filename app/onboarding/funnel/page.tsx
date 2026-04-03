'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FunnelData {
  slug: string;
  headline: string;
  subheadline: string;
  cta_label: string;
  sms_messages: { day: number; body: string }[];
}

const SMS_DAY_LABELS = ['Day 0', 'Day 1', 'Day 3', 'Day 7', 'Day 14'];

export default function OnboardingStep2() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('funnels')
        .select('slug, headline, subheadline, cta_label, sms_messages')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setFunnel(data as FunnelData);
      }
      setLoadingData(false);
    };
    init();
  }, [supabase, router]);

  const liveUrl = funnel ? `https://goelev8.ai/f/${funnel.slug}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const smsMessages = funnel?.sms_messages || [];

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
    urlBox: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      background: '#0e0e0e',
      border: '1px solid #202020',
      borderRadius: 1,
      padding: '0.85rem 1rem',
      cursor: 'pointer',
    } as React.CSSProperties,
    urlText: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.95rem',
      color: '#00CFFF',
      wordBreak: 'break-all' as const,
      flex: 1,
    } as React.CSSProperties,
    copyBtn: {
      padding: '0.4rem 0.85rem',
      background: copied ? '#00FF94' : '#181818',
      color: copied ? '#000' : '#F5F5F5',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.8rem',
      border: '1px solid #202020',
      borderRadius: 1,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.2s',
    } as React.CSSProperties,
    card: {
      background: '#0e0e0e',
      border: '1px solid #181818',
      borderRadius: 1,
      padding: '1.25rem',
    } as React.CSSProperties,
    label: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.75rem',
      color: '#4a4a4a',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '0.35rem',
    } as React.CSSProperties,
    value: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1rem',
      color: '#F5F5F5',
      margin: 0,
    } as React.CSSProperties,
    smsItem: {
      display: 'flex',
      gap: '1rem',
      padding: '0.85rem 0',
      borderBottom: '1px solid #181818',
    } as React.CSSProperties,
    dayBadge: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.75rem',
      color: '#00CFFF',
      background: '#181818',
      padding: '0.2rem 0.5rem',
      borderRadius: 1,
      whiteSpace: 'nowrap' as const,
      height: 'fit-content',
    } as React.CSSProperties,
    smsBody: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
      color: '#F5F5F5',
      lineHeight: 1.5,
      margin: 0,
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
    shareBtn: {
      padding: '0.7rem 1.5rem',
      background: 'transparent',
      color: '#00CFFF',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.95rem',
      border: '1px solid #00CFFF',
      borderRadius: 1,
      cursor: 'pointer',
    } as React.CSSProperties,
    loading: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1rem',
      color: '#999',
    } as React.CSSProperties,
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.stepRow}>
          <span style={styles.stepText}>Step 2 of 4</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={styles.dot(i === 1)} />
          ))}
        </div>

        <h1 style={styles.headline}>Review Your Funnel</h1>

        {loadingData ? (
          <p style={styles.loading}>Loading your funnel...</p>
        ) : !funnel ? (
          <p style={styles.loading}>
            No funnel found.{' '}
            <button
              onClick={() => router.push('/onboarding')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00CFFF',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'underline',
              }}
            >
              Go back and create one
            </button>
          </p>
        ) : (
          <>
            <p style={styles.sub}>Here is what we built for you.</p>

            <div>
              <p style={styles.label}>Live URL</p>
              <div style={styles.urlBox} onClick={handleCopy}>
                <span style={styles.urlText}>{liveUrl}</span>
                <button style={styles.copyBtn} onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={styles.label}>Headline</p>
                <p style={styles.value}>{funnel.headline}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={styles.label}>Subheadline</p>
                <p style={styles.value}>{funnel.subheadline}</p>
              </div>
              <div>
                <p style={styles.label}>Call to Action</p>
                <p style={styles.value}>{funnel.cta_label}</p>
              </div>
            </div>

            <div>
              <p style={{ ...styles.label, marginBottom: '0.75rem' }}>SMS Sequence</p>
              <div style={styles.card}>
                {smsMessages.length > 0 ? (
                  smsMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.smsItem,
                        ...(i === smsMessages.length - 1
                          ? { borderBottom: 'none' }
                          : {}),
                      }}
                    >
                      <span style={styles.dayBadge}>
                        {SMS_DAY_LABELS[i] || `Day ${msg.day}`}
                      </span>
                      <p style={styles.smsBody}>{msg.body}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ ...styles.sub, padding: '0.5rem 0' }}>
                    No SMS messages generated yet.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button style={styles.shareBtn} onClick={handleCopy}>
                {copied ? 'Link Copied!' : 'Share this link'}
              </button>
              <button
                style={styles.button}
                onClick={() => router.push('/onboarding/sms')}
              >
                Continue &rarr;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
