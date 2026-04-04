// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 24 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
