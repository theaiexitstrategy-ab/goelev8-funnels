'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill email from query params (lead capture flow)
  const paramEmail = searchParams.get('email');
  const paramName = searchParams.get('name');
  const slug = searchParams.get('slug');
  const funnelId = searchParams.get('funnel_id');

  useEffect(() => {
    if (paramEmail && !email) setEmail(paramEmail);
  }, [paramEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: paramName || '',
        },
      },
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(authError.message || 'Something went wrong. Please try again.');
      }
      setLoading(false);
      return;
    }

    // If we have a funnel to claim, do it now
    if (slug && funnelId && authData.user) {
      try {
        await fetch('/api/build/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            funnel_id: funnelId,
            slug,
          }),
        });
      } catch {
        // Non-fatal — user still signed up
        console.error('[signup] Failed to claim funnel');
      }
    }

    // Redirect
    if (slug) {
      router.push(`/portal?claimed=true&slug=${slug}`);
    } else {
      router.push('/portal');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#0e0e0e',
          border: '1px solid #222222',
          borderRadius: 8,
          padding: '48px 40px',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
              <path d="M50 10C30 10 10 25 10 50C10 75 30 90 50 90C55 90 60 88 65 85C55 82 45 72 45 60C45 48 55 38 65 35C70 33 75 33 80 35C85 25 75 10 50 10Z" fill="white"/>
              <path d="M65 35C55 38 45 48 45 60C45 72 55 82 65 85C75 80 85 70 85 55C85 42 78 35 65 35Z" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 19,
            letterSpacing: 2,
            textAlign: 'center',
            color: '#ffffff',
          }}>
            GOELEV8.AI
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 48,
            color: '#ffffff',
            marginTop: 24,
            marginBottom: 8,
            lineHeight: 1,
          }}>
            {slug ? 'CLAIM YOUR PAGE.' : 'START FREE TRIAL.'}
          </h1>
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: '#666666',
            marginBottom: 28,
          }}>
            {slug
              ? <>Your page at <strong style={{ color: '#00CFFF' }}>goelev8.ai/f/{slug}</strong> is ready. Create your account to activate it.</>
              : '7-day free trial. No credit card required.'}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase' as const,
                color: '#555555',
                marginBottom: 6,
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@yourbusiness.com"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #222222',
                  borderRadius: 4,
                  padding: '10px 14px',
                  color: '#F5F5F5',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#00CFFF'}
                onBlur={(e) => e.target.style.borderColor = '#222222'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase' as const,
                color: '#555555',
                marginBottom: 6,
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #222222',
                  borderRadius: 4,
                  padding: '10px 14px',
                  color: '#F5F5F5',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#00CFFF'}
                onBlur={(e) => e.target.style.borderColor = '#222222'}
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: '#FF3B3B',
                marginBottom: 14,
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 20,
                letterSpacing: '0.05em',
                background: loading ? '#007a99' : '#00CFFF',
                color: '#000000',
                border: 'none',
                borderRadius: 4,
                padding: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'CREATING ACCOUNT...' : (slug ? 'CLAIM PAGE & START TRIAL →' : 'START FREE TRIAL →')}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '22px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: '#222222' }} />
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: '#333333',
            }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: '#222222' }} />
          </div>

          {/* Sign in link */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: '#666666',
            }}>
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                style={{ color: '#00CFFF', textDecoration: 'none' }}
              >
                Sign in &rarr;
              </Link>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
