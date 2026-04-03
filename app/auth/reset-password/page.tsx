'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('This reset link has expired or is invalid. Please request a new one.');
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      router.push('/auth/login');
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
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '24px',
            color: '#F5F5F5',
            marginTop: '16px',
            marginBottom: '8px',
          }}>
            Set New Password
          </h2>
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
            Enter your new password below
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
            {error.includes('expired') && (
              <div style={{ marginTop: '8px' }}>
                <Link href="/auth/forgot-password" style={{
                  color: '#00CFFF',
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}>
                  Request a new reset link
                </Link>
              </div>
            )}
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
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter new password"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00CFFF'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#181818'; }}
            />
            <p style={{
              fontSize: '12px',
              color: passwordValid ? '#00FF94' : '#999',
              margin: '4px 0 0 0',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {passwordValid ? '✓' : '○'} 8+ characters
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#999',
              fontSize: '13px',
              marginBottom: '6px',
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00CFFF'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#181818'; }}
            />
            {confirmPassword.length > 0 && (
              <p style={{
                fontSize: '12px',
                color: passwordsMatch ? '#00FF94' : '#FF3B3B',
                margin: '4px 0 0 0',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordValid || !passwordsMatch}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (loading || !passwordValid || !passwordsMatch) ? '#4a4a4a' : '#00CFFF',
              color: '#000',
              border: 'none',
              borderRadius: '1px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: (loading || !passwordValid || !passwordsMatch) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
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
