'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function VerifyPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  const handleResend = async () => {
    setError('');
    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: '', // Will use the current session's email
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
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
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '36px',
          color: '#00CFFF',
          letterSpacing: '2px',
          margin: '0 0 32px 0',
        }}>
          GoElev8.ai
        </h1>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '1px',
          backgroundColor: 'rgba(0, 207, 255, 0.1)',
          border: '1px solid rgba(0, 207, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px',
        }}>
          ✉
        </div>

        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '28px',
          color: '#F5F5F5',
          margin: '0 0 12px 0',
        }}>
          Check Your Email
        </h2>

        <p style={{
          color: '#999',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '0 0 32px 0',
        }}>
          We sent a verification link to your email.
          Click it to activate your account.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 59, 0.1)',
            border: '1px solid #FF3B3B',
            borderRadius: '1px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#FF3B3B',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {resent ? (
          <div style={{
            backgroundColor: 'rgba(0, 255, 148, 0.1)',
            border: '1px solid #00FF94',
            borderRadius: '1px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#00FF94',
            fontSize: '13px',
          }}>
            Verification email resent successfully.
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: '#999', fontSize: '14px' }}>
              Didn&apos;t get it?{' '}
            </span>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: '#00CFFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: resending ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              {resending ? 'Sending...' : 'Resend'}
            </button>
          </div>
        )}

        <Link href="/auth/login" style={{
          display: 'inline-block',
          padding: '14px 32px',
          backgroundColor: 'transparent',
          color: '#00CFFF',
          border: '1px solid #181818',
          borderRadius: '1px',
          fontSize: '14px',
          fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'none',
          transition: 'border-color 0.2s',
        }}>
          ← Back to login
        </Link>

        <p style={{
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
