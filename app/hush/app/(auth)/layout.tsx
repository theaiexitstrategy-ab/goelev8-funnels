// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Shared shell for the Hush auth pages (signin, signup, future
// reset-password and OTP confirm). Provides the diamond + glow backdrop
// and centers the form card.

export default function HushAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-safe pb-safe">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(-45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 1px,transparent 26px)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 flex w-full max-w-[360px] flex-col items-center">
        {children}
      </div>
    </main>
  );
}
