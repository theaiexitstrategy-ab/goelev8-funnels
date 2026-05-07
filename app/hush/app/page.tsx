// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// /hush/app — PWA splash. Branded entry point with sign in / sign up CTAs.
// Visual mirrors reference/hush/hush-guest-app.html "ob-" onboarding intro.

import Link from 'next/link';

export default function HushAppSplash() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-7 pt-safe pb-safe">
      {/* Diamond pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(-45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px)',
        }}
      />
      {/* Pulsing gold glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center text-center">
        <h1 className="bg-hush-gold-logo text-fill-transparent animate-fade-up font-bebas text-[88px] leading-none tracking-wide" style={{ filter: 'drop-shadow(0 0 32px rgba(201,168,76,0.45))' }}>
          HUSH
        </h1>
        <p className="-mt-2 animate-fade-up font-bebas text-[13px] tracking-[0.35em] text-[rgba(201,168,76,0.5)]" style={{ animationDelay: '0.15s' }}>
          AI
        </p>
        <p className="mb-12 mt-3 animate-fade-up font-cormorant text-[16px] italic text-hush-muted" style={{ animationDelay: '0.3s' }}>
          Find the party. Own the night.
        </p>

        <div className="flex w-full flex-col gap-3 animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <Link
            href="/hush/app/signup"
            className="bg-hush-gold-btn flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98]"
          >
            CREATE ACCOUNT
          </Link>
          <Link
            href="/hush/app/signin"
            className="flex w-full items-center justify-center rounded-md border border-hush-gline bg-hush-card py-[15px] font-bebas text-[16px] tracking-[0.2em] text-hush-white transition-colors active:bg-hush-card2"
          >
            SIGN IN
          </Link>
        </div>

        <p className="mt-10 animate-fade-up font-outfit text-[10px] uppercase tracking-[0.3em] text-hush-muted" style={{ animationDelay: '0.6s' }}>
          By GoElev8
        </p>
      </div>
    </main>
  );
}
