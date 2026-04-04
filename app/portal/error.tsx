// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
        There was an error loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
