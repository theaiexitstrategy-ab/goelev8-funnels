'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: funnels } = await supabase
          .from('funnels')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1);

        if (funnels && funnels.length > 0) {
          router.push('/portal');
        } else {
          router.push('/onboarding');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#202020',
    border: '1px solid #181818',
    borderRadius: '1px',
    color: '#F5F5F5',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#0e0e0e',
        border: '1px solid #181818',
        borderRadius: '1px',
        padding: '48px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '36px',
            color: '#00CFFF',
            letterSpacing: '2px',
            margin: 0,
          }}>
            GoElev8.ai
          </h1>
          <p style={{
            color: '#999',
            fontSize: '14px',
            marginTop: '8px',
          }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 59, 0.1)',
            border: '1px solid #FF3B3B',
            borderRadius: '1px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#FF3B3B',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#999',
              fontSize: '13px',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00CFFF'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#181818'; }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              color: '#999',
              fontSize: '13px',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00CFFF'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#181818'; }}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link href="/auth/forgot-password" style={{
              color: '#00CFFF',
              fontSize: '13px',
              textDecoration: 'none',
            }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#4a4a4a' : '#00CFFF',
              color: '#000',
              border: 'none',
              borderRadius: '1px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          color: '#999',
          fontSize: '14px',
        }}>
          New here?{' '}
          <Link href="/auth/signup" style={{
            color: '#00FF94',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Build your AI page free →
          </Link>
        </p>

        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          color: '#4a4a4a',
          fontSize: '11px',
        }}>
          © 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
        </p>
      </div>
    </div>
  );
}
