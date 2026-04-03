'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 250,
    price: 25,
    perMsg: '$0.10/msg',
    badge: null,
  },
  {
    id: 'active',
    name: 'Active',
    credits: 625,
    price: 50,
    perMsg: '$0.08/msg',
    badge: 'POPULAR',
  },
  {
    id: 'blaster',
    name: 'Blaster',
    credits: 2000,
    price: 100,
    perMsg: '$0.05/msg',
    badge: 'BEST VALUE',
  },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login');
    });
  }, [supabase, router]);

  const handleBuy = async () => {
    if (!selected || purchasing) return;
    setPurchasing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const pkg = PACKAGES.find((p) => p.id === selected);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': session?.access_token || '',
        },
        body: JSON.stringify({
          type: 'sms_credits',
          sms_package: pkg?.credits,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPurchasing(false);
      }
    } catch {
      setPurchasing(false);
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
      maxWidth: 720,
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
      fontSize: '2.2rem',
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    } as React.CSSProperties,
    card: (isSelected: boolean) =>
      ({
        background: '#0e0e0e',
        border: `1px solid ${isSelected ? '#00CFFF' : '#202020'}`,
        borderRadius: 1,
        padding: '1.5rem',
        cursor: 'pointer',
        position: 'relative' as const,
        transition: 'border-color 0.2s',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.75rem',
        textAlign: 'center' as const,
      }) as React.CSSProperties,
    badge: (text: string) =>
      ({
        position: 'absolute' as const,
        top: -10,
        right: 12,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.5px',
        padding: '0.2rem 0.55rem',
        borderRadius: 1,
        background: text === 'BEST VALUE' ? '#00FF94' : '#00CFFF',
        color: '#000',
        fontWeight: 700,
      }) as React.CSSProperties,
    pkgName: {
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: '1.4rem',
      color: '#F5F5F5',
      margin: 0,
    } as React.CSSProperties,
    credits: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '2rem',
      color: '#F5F5F5',
      fontWeight: 700,
      margin: 0,
      lineHeight: 1,
    } as React.CSSProperties,
    creditsLabel: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.8rem',
      color: '#999',
      margin: 0,
    } as React.CSSProperties,
    price: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '1.5rem',
      color: '#00CFFF',
      fontWeight: 700,
      margin: 0,
    } as React.CSSProperties,
    perMsg: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.75rem',
      color: '#4a4a4a',
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
      alignSelf: 'flex-start' as const,
    } as React.CSSProperties,
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    } as React.CSSProperties,
    note: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '0.8rem',
      color: '#4a4a4a',
      margin: 0,
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
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.stepRow}>
          <span style={styles.stepText}>Step 3 of 4</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={styles.dot(i === 2)} />
          ))}
        </div>

        <h1 style={styles.headline}>
          Your SMS sequence is ready. You need credits to send it.
        </h1>

        <div style={styles.grid}>
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={styles.card(selected === pkg.id)}
              onClick={() => setSelected(pkg.id)}
            >
              {pkg.badge && (
                <span style={styles.badge(pkg.badge)}>{pkg.badge}</span>
              )}
              <p style={styles.pkgName}>{pkg.name}</p>
              <p style={styles.credits}>{pkg.credits.toLocaleString()}</p>
              <p style={styles.creditsLabel}>credits</p>
              <p style={styles.price}>${pkg.price}</p>
              <span style={styles.perMsg}>{pkg.perMsg}</span>
            </div>
          ))}
        </div>

        <button
          style={{
            ...styles.button,
            ...(!selected || purchasing ? styles.buttonDisabled : {}),
          }}
          onClick={handleBuy}
          disabled={!selected || purchasing}
        >
          {purchasing ? 'Redirecting...' : 'Buy Credits'}
        </button>

        <p style={styles.note}>Credits never expire. Buy more anytime.</p>

        <button
          style={styles.skipLink}
          onClick={() => router.push('/onboarding/products')}
        >
          Skip &mdash; I&apos;ll add credits later &rarr;
        </button>
      </div>
    </div>
  );
}
