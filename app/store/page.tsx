// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Product Store | GoElev8.ai', description: 'Sell products directly from your AI business page' };

export default function StoreLandingPage() {
  return (
    <div style={{ background: '#000', color: '#E0E0E0', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,207,255,0.009) 2px, rgba(0,207,255,0.009) 4px)' }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <a href="/" style={{ display: 'inline-flex', lineHeight: 0 }}><img src="/images/goelev8-full-logo.png" alt="GoElev8.ai — Infinite Possibilities" width={60} height={60} style={{ display: 'block' }} /></a>
        <a href="/auth/signup" style={{ background: '#00CFFF', color: '#000', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: 1 }}>Start Free Trial</a>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: '#fff', textAlign: 'center', letterSpacing: 3, marginBottom: 16 }}>PRODUCT STORE</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 18, marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' }}>
          Sell products and services directly from your AI business page. Accept payments with Stripe. Connect your existing store.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 60 }}>
          {[
            { icon: '💳', title: 'Stripe Payments', desc: 'Apple Pay, Google Pay, Link — all built in. You get paid instantly via Stripe Connect.' },
            { icon: '🔗', title: 'Connect Existing Store', desc: 'Shopify, WooCommerce, Wix, Squarespace, BigCommerce — pull your catalog in.' },
            { icon: '📱', title: 'Mobile-First Store', desc: 'Beautiful store page at /f/your-slug/store. Matches your funnel design.' },
            { icon: '📊', title: 'Sales Analytics', desc: 'Track every sale, conversion, and revenue split in your portal dashboard.' },
            { icon: '📲', title: 'SMS Product Blasts', desc: 'Announce new products to your lead list with one-click SMS campaigns.' },
            { icon: '🏷️', title: 'Low Platform Fee', desc: '10% on Launch/Grow plans. 8% on Scale. You keep the rest.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <span style={{ fontSize: 32 }}>{f.icon}</span>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginTop: 12, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/auth/signup" style={{ display: 'inline-block', background: '#00CFFF', color: '#000', padding: '14px 40px', borderRadius: 8, fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 2, textDecoration: 'none' }}>
            START SELLING &rarr;
          </a>
          <p style={{ color: '#555', fontSize: 13, marginTop: 12 }}>Included in all plans. 7-day free trial.</p>
        </div>
      </main>

      <footer style={{ maxWidth: 1200, margin: '80px auto 0', padding: '32px 24px', borderTop: '1px solid #1A1A1A', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: 12, color: '#333' }}>&copy; 2026 GoElev8.ai &middot; Aaron Bryant &middot; All rights reserved.</p>
      </footer>
    </div>
  );
}
