// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useMemo } from 'react';

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

  // CSS var fallback so we never depend on dynamic Tailwind class generation
  // for the seller's brand color.
  const cssVars = useMemo(() => ({
    ['--accent' as any]: client.accentColor,
  }), [client.accentColor]);

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
        {!hasProducts ? (
          <div style={{ textAlign: 'center', padding: '80px 16px', color: '#9CA3AF' }}>
            <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Coming soon</p>
            <p>Check back soon for new products.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {products.map((p) => <ProductCard key={p.id} product={p} accent={client.accentColor} />)}
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

function ProductCard({ product, accent }: { product: MerchProduct; accent: string }) {
  const showCompareAt =
    product.compareAtCents != null && product.compareAtCents > product.priceCents;
  const canBuy = !!product.paymentLink;

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
            <a
              href={product.paymentLink!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buy ${product.name}`}
              style={{
                display: 'block', textAlign: 'center',
                background: accent, color: '#fff',
                padding: '11px 22px', borderRadius: 8,
                textDecoration: 'none', fontWeight: 600, fontSize: 14,
              }}
            >
              Buy Now →
            </a>
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
