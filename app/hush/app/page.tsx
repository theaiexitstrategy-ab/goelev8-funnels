// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// /hush/app — PWA root. Placeholder splash until auth & onboarding ship.

export default function HushAppHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-bebas text-6xl tracking-wider bg-hush-gold-text bg-clip-text text-transparent">
        HUSH
      </h1>
      <p className="font-cormorant text-2xl italic text-hush-muted2">
        Find the party. Own the night.
      </p>
      <p className="mt-12 font-outfit text-xs uppercase tracking-[0.3em] text-hush-muted">
        Coming soon
      </p>
    </main>
  );
}
