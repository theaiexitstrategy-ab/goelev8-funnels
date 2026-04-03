'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const PLATFORMS = [
  { name: 'Shopify', icon: '\uD83D\uDED2' },
  { name: 'Squarespace', icon: '\u25A0' },
  { name: 'Wix', icon: '\uD83C\uDF10' },
  { name: 'WooCommerce', icon: '\uD83D\uDCE6' },
  { name: 'BigCommerce', icon: '\uD83C\uDFEA' },
  { name: 'Add Manually', icon: '\u2795' },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login');
    });
  }, [supabase, router]);

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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
    } as React.CSSProperties,
    platformBtn: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      background: '#0e0e0e',
      border: '1px solid #202020',
      borderRadius: 1,
      padding: '1.5rem 1rem',
      cursor: 'pointer',
      transition: 'border-color 0.2s',
    } as React.CSSProperties,
    platformIcon: {
      fontSize: '1.8rem',
    } as React.CSSProperties,
    platformName: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
      color: '#F5F5F5',
      fontWeight: 600,
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
    skipLink: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.9rem',
      color: '#00CFFF',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: 0,
      alignSelf: 'flex-start' as const,
    } as React.CSSProperties,
    note: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.8rem',
      color: '#4a4a4a',
      margin: 0,
    } as React.CSSProperties,
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.stepRow}>
          <span style={styles.stepText}>Step 4 of 4</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={styles.dot(i === 3)} />
          ))}
        </div>

        <h1 style={styles.headline}>Connect your store or add a product</h1>

        <div style={styles.grid}>
          {PLATFORMS.map((platform) => (
            <button
              key={platform.name}
              style={styles.platformBtn}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00CFFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#202020';
              }}
            >
              <span style={styles.platformIcon}>{platform.icon}</span>
              <span style={styles.platformName}>{platform.name}</span>
            </button>
          ))}
        </div>

        <p style={styles.note}>
          You can always connect your store later from Settings.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            style={styles.skipLink}
            onClick={() => router.push('/portal')}
          >
            Skip for now &rarr;
          </button>
          <button
            style={styles.button}
            onClick={() => router.push('/portal')}
          >
            Go to Dashboard &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
