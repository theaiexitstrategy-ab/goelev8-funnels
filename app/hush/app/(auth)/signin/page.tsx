'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush sign-in. Same Supabase backend as goelev8.ai (signInWithPassword,
// shared auth.users table) — Hush-themed UI.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function mapAuthError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Please confirm your email before signing in.';
    case 'too_many_requests':
      return 'Too many attempts. Please wait and try again.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

export default function HushSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(mapAuthError(authError));
      setLoading(false);
      return;
    }

    router.push('/hush/app/onboarding');
  };

  return (
    <>
      {/* Logo block — mirrors splash for brand continuity */}
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
        Welcome back.
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
            autoComplete="current-password"
            placeholder="Your password"
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
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>

      <p
        className="mt-6 animate-fade-up font-outfit text-[13px] text-hush-muted2"
        style={{ animationDelay: '0.4s' }}
      >
        New here?{' '}
        <Link href="/hush/app/signup" className="font-bebas tracking-[0.1em] text-hush-gold">
          CREATE ACCOUNT
        </Link>
      </p>
    </>
  );
}
