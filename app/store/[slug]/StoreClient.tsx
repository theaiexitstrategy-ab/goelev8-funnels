// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useMemo, useState } from 'react';

export type MerchProduct = {
  id: string;
  productKey: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  compareAtCents: number | null;
  paymentLink: string | null;
};

export type StoreClientInfo = {
  slug: string;
  name: string;
  accentColor: string;
  logoUrl: string | null;
  hasConnect: boolean;
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function StoreClient({
  client,
  products,
}: {
  client: StoreClientInfo;
  products: MerchProduct[];
}) {
  const hasProducts = products.length > 0;
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState('');

  const cssVars = useMemo(() => ({
    ['--accent' as any]: client.accentColor,
  }), [client.accentColor]);

  const onBuy = async (product: MerchProduct) => {
    // Prefer native checkout when the seller has Stripe Connect set up.
    if (client.hasConnect) {
      setBuying(product.id);
      setBuyError('');
      try {
        const res = await fetch('/api/merch/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        // Connect not set up after all, or other failure → fall back to payment link.
        if (product.paymentLink) {
          window.location.href = product.paymentLink;
          return;
        }
        setBuyError(data.error || 'Checkout could not start. Try again in a moment.');
      } catch {
        if (product.paymentLink) {
          window.location.href = product.paymentLink;
          return;
        }
        setBuyError('Network error. Try again.');
      } finally {
        setBuying(null);
      }
      return;
    }
    // No Connect on this seller: direct to payment_link (Phase 1 behavior).
    if (product.paymentLink) {
      window.location.href = product.paymentLink;
    }
  };

  return (
    <div style={{ ...cssVars, minHeight: '100vh', background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{ background: 'var(--accent)', color: '#fff', padding: '36px 16px', textAlign: 'center' }}>
        {client.logoUrl ? (
          <img
            src={client.logoUrl}
            alt={`${client.name} logo`}
            style={{ height: 56, width: 'auto', display: 'block', margin: '0 auto 14px', borderRadius: 8, background: 'rgba(0,0,0,0.15)', padding: 4 }}
          />
        ) : null}
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{client.name}</h1>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Shop the collection</p>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px 60px' }}>
        {buyError ? (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {buyError}
          </div>
        ) : null}

        {!hasProducts ? (
          <div style={{ textAlign: 'center', padding: '80px 16px', color: '#9CA3AF' }}>
            <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Coming soon</p>
            <p>Check back soon for new products.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                accent={client.accentColor}
                hasConnect={client.hasConnect}
                buying={buying === p.id}
                onBuy={() => onBuy(p)}
              />
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '20px 16px 32px', color: '#9CA3AF', fontSize: 12 }}>
        <a href="https://goelev8.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
          Powered by GoElev8.ai
        </a>
        <div style={{ marginTop: 6 }}>&copy; 2026 GoElev8.ai</div>
      </footer>
    </div>
  );
}

function ProductCard({
  product, accent, hasConnect, buying, onBuy,
}: {
  product: MerchProduct;
  accent: string;
  hasConnect: boolean;
  buying: boolean;
  onBuy: () => void;
}) {
  const showCompareAt =
    product.compareAtCents != null && product.compareAtCents > product.priceCents;
  // Native checkout when seller has Connect; payment_link fallback otherwise.
  const canBuy = hasConnect || !!product.paymentLink;

  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
    }}>
      {product.imageUrl ? (
        <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#F3F4F6' }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ width: '100%', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', fontSize: 48 }}>
          🧢
        </div>
      )}

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{product.name}</h2>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{dollars(product.priceCents)}</div>
            {showCompareAt ? (
              <div style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through', marginTop: 1 }}>
                {dollars(product.compareAtCents!)}
              </div>
            ) : null}
          </div>
        </div>

        {product.description ? (
          <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            {product.description.length > 140 ? product.description.slice(0, 140) + '…' : product.description}
          </p>
        ) : null}

        <div style={{ marginTop: 'auto', paddingTop: 6 }}>
          {canBuy ? (
            <button
              type="button"
              onClick={onBuy}
              disabled={buying}
              aria-label={`Buy ${product.name}`}
              style={{
                width: '100%',
                background: accent, color: '#fff',
                border: 'none',
                padding: '11px 22px', borderRadius: 8,
                fontWeight: 600, fontSize: 14,
                cursor: buying ? 'wait' : 'pointer',
                opacity: buying ? 0.7 : 1,
              }}
            >
              {buying ? 'Loading…' : 'Buy Now →'}
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-label={`${product.name} — coming soon`}
              style={{
                width: '100%', background: '#F3F4F6', color: '#9CA3AF',
                border: '1px dashed #D1D5DB', padding: '11px 22px', borderRadius: 8,
                fontWeight: 600, fontSize: 14, cursor: 'not-allowed',
              }}
            >
              Coming soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
