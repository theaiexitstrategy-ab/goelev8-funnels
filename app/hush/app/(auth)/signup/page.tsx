'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush sign-up. Same Supabase backend as goelev8.ai (signUp, shared
// auth.users table) — Hush-themed UI. Two outcomes:
//   1. signUp returns a session (auto-confirm on this project) →
//      redirect straight to /hush/app/onboarding.
//   2. signUp returns no session (email confirmation required) →
//      show "check your email" state. The confirmation email's link
//      points back at /auth/callback?next=/hush/app/onboarding so
//      the user lands in the right flow on click.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function HushSignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/hush/app/onboarding`,
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

      if (data.session) {
        // Auto-confirmed (or returning user) — go straight in.
        router.push('/hush/app/onboarding');
        return;
      }

      // Email confirmation required.
      setConfirmSent(true);
      setLoading(false);
    } catch (err) {
      console.error('[hush/signup] signUp threw:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not reach the auth server. Check your connection and try again.';
      setError(msg);
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <>
        <h1
          className="bg-hush-gold-logo text-fill-transparent animate-fade-up font-bebas text-[64px] leading-none tracking-wide"
          style={{ filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.4))' }}
        >
          HUSH
        </h1>
        <p
          className="-mt-1 animate-fade-up font-bebas text-[11px] tracking-[0.35em] text-[rgba(201,168,76,0.5)]"
          style={{ animationDelay: '0.1s' }}
        >
          AI
        </p>
        <p
          className="mt-3 animate-fade-up font-cormorant text-[18px] italic text-hush-white"
          style={{ animationDelay: '0.2s' }}
        >
          Check your email.
        </p>
        <p
          className="mt-3 animate-fade-up text-center font-outfit text-[13px] leading-relaxed text-hush-muted2"
          style={{ animationDelay: '0.3s' }}
        >
          We sent a confirmation link to{' '}
          <span className="text-hush-gold">{email}</span>. Tap it to finish
          creating your account.
        </p>
        <p
          className="mt-6 animate-fade-up font-outfit text-[11px] leading-relaxed text-hush-muted"
          style={{ animationDelay: '0.4s' }}
        >
          Don&apos;t see it? Check spam, or wait 30 seconds and try again.
        </p>
        <Link
          href="/hush/app/signin"
          className="mt-8 animate-fade-up font-bebas text-[14px] tracking-[0.2em] text-hush-gold"
          style={{ animationDelay: '0.5s' }}
        >
          BACK TO SIGN IN
        </Link>
      </>
    );
  }

  return (
    <>
      <h1
        className="bg-hush-gold-logo text-fill-transparent animate-fade-up font-bebas text-[64px] leading-none tracking-wide"
        style={{ filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.4))' }}
      >
        HUSH
      </h1>
      <p
        className="-mt-1 animate-fade-up font-bebas text-[11px] tracking-[0.35em] text-[rgba(201,168,76,0.5)]"
        style={{ animationDelay: '0.1s' }}
      >
        AI
      </p>
      <p
        className="mb-8 mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted"
        style={{ animationDelay: '0.2s' }}
      >
        You&apos;re on the list.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.3s' }}
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            placeholder="At least 6 characters"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        {error && (
          <div className="font-outfit text-[12px] leading-snug text-hush-red">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-hush-gold-btn mt-2 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
        </button>

        <p className="mt-2 text-center font-outfit text-[10px] leading-snug text-hush-muted">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-hush-muted2 underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-hush-muted2 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p
        className="mt-6 animate-fade-up font-outfit text-[13px] text-hush-muted2"
        style={{ animationDelay: '0.4s' }}
      >
        Already have an account?{' '}
        <Link href="/hush/app/signin" className="font-bebas tracking-[0.1em] text-hush-gold">
          SIGN IN
        </Link>
      </p>
    </>
  );
}
