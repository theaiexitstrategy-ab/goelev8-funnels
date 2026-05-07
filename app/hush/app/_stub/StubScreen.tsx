// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared "coming soon" placeholder for role-aware home destinations
// that ship in subsequent priorities. Replaced one-by-one as the real
// feed/dashboard/profile/etc. screens land.

export default function StubScreen({
  eyebrow,
  title,
  tagline,
}: {
  eyebrow: string;
  title: string;
  tagline: string;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-7 pt-safe pb-safe">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(-45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center text-center">
        <p className="animate-fade-up font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
          {eyebrow}
        </p>
        <h1
          className="bg-hush-gold-text-mid text-fill-transparent mt-3 animate-fade-up font-bebas text-[44px] leading-tight tracking-wide"
          style={{ animationDelay: '0.1s' }}
        >
          {title}
        </h1>
        <p
          className="mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted2"
          style={{ animationDelay: '0.2s' }}
        >
          {tagline}
        </p>
        <p
          className="mt-12 animate-fade-up font-outfit text-[10px] uppercase tracking-[0.3em] text-hush-muted"
          style={{ animationDelay: '0.3s' }}
        >
          Coming soon
        </p>
      </div>
    </main>
  );
}
