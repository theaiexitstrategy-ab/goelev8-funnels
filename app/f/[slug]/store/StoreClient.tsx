// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useState } from 'react';

type Product = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  product_type: string;
  icon_emoji: string;
  image_url: string | null;
  external_url: string | null;
  platform: string | null;
};

type FunnelInfo = {
  name: string;
  slug: string;
  accent_color: string;
};

export default function StoreClient({
  funnel,
  products,
}: {
  funnel: FunnelInfo;
  products: Product[];
}) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const handleBuyNative = async (product: Product) => {
    setPurchasing(product.id);
    setCheckoutError('');

    try {
      const res = await fetch('/api/products/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          funnel_slug: funnel.slug,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to start checkout');
        return;
      }

      // Load Stripe and show Payment Element
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        setCheckoutError('Payment system unavailable');
        return;
      }

      const { error } = await stripe.confirmPayment({
        clientSecret: data.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/f/${funnel.slug}/store?purchased=${product.id}`,
        },
      });

      if (error) {
        setCheckoutError(error.message || 'Payment failed');
      }
    } catch {
      setCheckoutError('Something went wrong');
    } finally {
      setPurchasing(null);
    }
  };

  const isExternal = (product: Product) => !!product.external_url && !!product.platform;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        background: funnel.accent_color,
        color: '#fff',
        padding: '40px 16px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{funnel.name}</h1>
        <p style={{ fontSize: 16, opacity: 0.9, marginTop: 8 }}>Shop Our Products</p>
      </header>

      {/* Products */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
        {checkoutError && (
          <div style={{
            background: '#FEF2F2', color: '#991B1B', padding: '12px 16px',
            borderRadius: 8, marginBottom: 20, fontSize: 14,
          }}>
            {checkoutError}
          </div>
        )}

        {products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 16px', color: '#9CA3AF',
          }}>
            <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Coming soon</p>
            <p>Check back soon for new products.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {products.map((product) => (
              <div key={product.id} style={{
                background: '#fff',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Product Image or Icon */}
                {product.image_url ? (
                  <div style={{
                    width: '100%', height: 200, overflow: 'hidden',
                    background: '#F3F4F6',
                  }}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%', height: 120, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#F3F4F6', fontSize: 48,
                  }}>
                    {product.icon_emoji || '📦'}
                  </div>
                )}

                {/* Product Details */}
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{product.name}</h2>
                    <span style={{
                      fontSize: 20, fontWeight: 700, color: funnel.accent_color, whiteSpace: 'nowrap',
                    }}>
                      ${(product.price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  <span style={{
                    fontSize: 12, color: '#6B7280', textTransform: 'capitalize',
                  }}>
                    {product.product_type}
                  </span>

                  {product.description && (
                    <p style={{ fontSize: 14, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                      {product.description.length > 150
                        ? product.description.slice(0, 150) + '...'
                        : product.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                    {isExternal(product) ? (
                      <a
                        href={product.external_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block', textAlign: 'center',
                          background: funnel.accent_color, color: '#fff',
                          padding: '12px 24px', borderRadius: 8,
                          textDecoration: 'none', fontWeight: 600, fontSize: 15,
                        }}
                      >
                        Buy Now
                      </a>
                    ) : (
                      <button
                        onClick={() => handleBuyNative(product)}
                        disabled={purchasing === product.id}
                        style={{
                          width: '100%', background: funnel.accent_color, color: '#fff',
                          border: 'none', padding: '12px 24px', borderRadius: 8,
                          fontWeight: 600, fontSize: 15, cursor: 'pointer',
                          opacity: purchasing === product.id ? 0.6 : 1,
                        }}
                      >
                        {purchasing === product.id ? 'Processing...' : 'Buy Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px 16px', color: '#9CA3AF', fontSize: 12,
      }}>
        <a
          href="https://goelev8.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#9CA3AF', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          Powered by GoElev8.ai
        </a>
      </footer>
    </div>
  );
}
