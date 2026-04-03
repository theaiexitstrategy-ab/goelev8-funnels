'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
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
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '24px',
            color: '#F5F5F5',
            marginTop: '16px',
            marginBottom: '8px',
          }}>
            Reset Password
          </h2>
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {success ? (
          <div>
            <div style={{
              backgroundColor: 'rgba(0, 255, 148, 0.1)',
              border: '1px solid #00FF94',
              borderRadius: '1px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <p style={{ color: '#00FF94', fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0' }}>
                Check your email
              </p>
              <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
                We sent a password reset link to <strong style={{ color: '#F5F5F5' }}>{email}</strong>
              </p>
            </div>
            <Link href="/auth/login" style={{
              display: 'block',
              textAlign: 'center',
              color: '#00CFFF',
              fontSize: '14px',
              textDecoration: 'none',
            }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
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
              <div style={{ marginBottom: '24px' }}>
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/auth/login" style={{
                color: '#00CFFF',
                fontSize: '14px',
                textDecoration: 'none',
              }}>
                ← Back to login
              </Link>
            </p>
          </>
        )}

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
