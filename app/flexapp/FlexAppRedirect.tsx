// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Client-side redirect with a branded 2-second intermediate screen.
// Kept separate from page.tsx so the server component there can keep
// exporting metadata (Next.js doesn't allow metadata exports from
// 'use client' modules).

'use client';

import { useEffect } from 'react';

export default function FlexAppRedirect({ appStoreUrl }: { appStoreUrl: string }) {
  useEffect(() => {
    // window.location.replace() instead of .href so the redirect page
    // doesn't end up in the browser's back stack — tapping Back from
    // the App Store should land them on the SMS / page they came from,
    // not bounce them back here.
    const t = setTimeout(() => {
      try { window.location.replace(appStoreUrl); }
      catch { window.location.href = appStoreUrl; }
    }, 2000);
    return () => clearTimeout(t);
  }, [appStoreUrl]);

  return (
    <>
      {/* Meta-refresh as a JS-disabled fallback. Fires at the same 2s
         mark as the JS redirect so the UX is identical either way. */}
      <noscript>
        <meta httpEquiv="refresh" content={`2; url=${appStoreUrl}`} />
      </noscript>

      <main style={pageStyle} role="main">
        <div style={cardStyle}>
          <img
            src="https://theflexfacility.com/flex-logo.png"
            alt="The Flex Facility"
            style={logoStyle}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={brandStyle}>
            FLEX
            <span style={facilityStyle}>Facility</span>
          </div>
          <p style={statusStyle} aria-live="polite">Taking you to the FLEX App…</p>
          <div style={spinnerStyle} data-flexapp-spinner aria-hidden="true" />
          <p style={fallbackStyle}>
            <a href={appStoreUrl} style={fallbackLinkStyle}>
              Click here if you are not redirected
            </a>
          </p>
        </div>

        <div style={footerStyle}>
          Powered by <a href="https://goelev8.ai" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>GoElev8.ai</a>
        </div>
      </main>

      {/* Spinner keyframes — inlined so the page is self-contained and
         doesn't depend on the marketing site's global stylesheet.
         prefers-reduced-motion respected via the @media block. */}
      <style jsx global>{`
        @keyframes flexapp-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          [data-flexapp-spinner] { animation: none !important; }
        }
      `}</style>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
// Inline so this page renders correctly even if the global stylesheet
// fails to load. Mobile-first sizing via clamp() and safe-area-inset
// padding so the spinner + brand mark fit inside an iPhone notch.

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 20px env(safe-area-inset-bottom, 32px)',
  margin: 0,
  position: 'relative',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  margin: '0 auto 28px',
  display: 'block',
  objectFit: 'contain',
};

const brandStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 'clamp(48px, 12vw, 72px)',
  letterSpacing: '0.05em',
  lineHeight: 1,
  textTransform: 'uppercase',
  marginBottom: 6,
  color: '#fff',
};

const facilityStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'clamp(14px, 4vw, 18px)',
  letterSpacing: '0.42em',
  color: '#9a9a9a',
  marginTop: 8,
  fontWeight: 700,
};

const statusStyle: React.CSSProperties = {
  marginTop: 36,
  fontSize: 15,
  color: '#fff',
  lineHeight: 1.55,
};

const spinnerStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  margin: '24px auto 0',
  border: '3px solid rgba(0, 255, 255, 0.18)',
  borderTopColor: '#00FFFF',
  borderRadius: '50%',
  animation: 'flexapp-spin 0.9s linear infinite',
};

const fallbackStyle: React.CSSProperties = {
  marginTop: 28,
  fontSize: 13,
  color: '#9a9a9a',
  lineHeight: 1.5,
};

const fallbackLinkStyle: React.CSSProperties = {
  color: '#00FFFF',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(0, 255, 255, 0.45)',
  paddingBottom: 1,
};

const footerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'max(16px, env(safe-area-inset-bottom))',
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.25)',
};
