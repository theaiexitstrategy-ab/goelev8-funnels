// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';

type Product = {
  id: string;
  name: string;
  price_cents: number;
  product_type: string;
  description: string;
  icon_emoji: string;
  is_active: boolean;
  total_sold: number;
  platform: string | null;
  external_url: string | null;
};

type StoreIntegration = {
  id: string;
  platform: string;
  status: string;
  product_count: number;
  last_sync_at: string | null;
};

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', color: '#96BF48' },
  { id: 'squarespace', name: 'Squarespace', color: '#000000' },
  { id: 'wix', name: 'Wix', color: '#0C6EFC' },
  { id: 'woocommerce', name: 'WooCommerce', color: '#96588A' },
  { id: 'bigcommerce', name: 'BigCommerce', color: '#34313F' },
  { id: 'manual', name: 'Manual Import', color: '#6B7280' },
];

export default function PortalProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [integrations, setIntegrations] = useState<StoreIntegration[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountLast4, setStripeAccountLast4] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnelSlug, setFunnelSlug] = useState('');

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', product_type: 'digital', description: '', icon_emoji: '',
  });

  // Connect store form state
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [productsRes, integrationsRes, profileRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/integrations'),
        fetch('/api/profile'),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (integrationsRes.ok) setIntegrations(await integrationsRes.json());
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setStripeConnected(!!profile.stripe_connect_account_id);
        setStripeAccountLast4(profile.stripe_connect_account_id?.slice(-4) || '');
        setFunnelSlug(profile.primary_funnel_slug || '');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProduct.name,
        price_cents: Math.round(parseFloat(newProduct.price) * 100),
        product_type: newProduct.product_type,
        description: newProduct.description,
        icon_emoji: newProduct.icon_emoji,
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', product_type: 'digital', description: '', icon_emoji: '' });
      loadData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleConnectStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectPlatform) return;
    const res = await fetch('/api/products/connect-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: connectPlatform, ...connectForm }),
    });
    if (res.ok) {
      setConnectPlatform(null);
      setConnectForm({});
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || 'Connection failed');
    }
  };

  const getStripeConnectUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(origin + '/api/stripe/connect/callback')}`;
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, color: '#111' }}>
        Product Store
      </h1>

      {/* SECTION 1: Stripe Connect Status */}
      <section style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Payment Setup</h2>
        {stripeConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: '#D1FAE5', color: '#065F46', padding: '4px 12px',
              borderRadius: 20, fontSize: 14, fontWeight: 500,
            }}>
              Stripe Connected
            </span>
            <span style={{ color: '#6B7280', fontSize: 14 }}>
              Account ending in {stripeAccountLast4}
            </span>
          </div>
        ) : (
          <div>
            <p style={{ color: '#6B7280', marginBottom: 12, fontSize: 14 }}>
              Connect your Stripe account to accept payments for your products.
            </p>
            <a
              href={getStripeConnectUrl()}
              style={{
                display: 'inline-block', background: '#635BFF', color: '#fff',
                padding: '10px 24px', borderRadius: 8, textDecoration: 'none',
                fontWeight: 600, fontSize: 14,
              }}
            >
              Connect Stripe Account
            </a>
          </div>
        )}
      </section>

      {/* SECTION 2: Native Product Store */}
      <section style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Your Products</h2>
            {funnelSlug && (
              <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                Store URL: goelev8.ai/f/{funnelSlug}/store
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            + Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>
            No products yet. Add your first product to get started.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {products.map((product) => (
              <div key={product.id} style={{
                border: '1px solid #E5E7EB', borderRadius: 10, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{product.icon_emoji || '📦'}</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{product.name}</h3>
                      <span style={{ color: '#6B7280', fontSize: 13 }}>{product.product_type}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>
                    ${(product.price_cents / 100).toFixed(2)}
                  </span>
                </div>
                {product.description && (
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                    {product.description.slice(0, 100)}{product.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {product.total_sold || 0} sold
                    {product.platform && ` | via ${product.platform}`}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        background: 'none', border: '1px solid #FCA5A5', color: '#EF4444',
                        borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: External Store Integrations */}
      <section style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>External Store Integrations</h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
          Connect your existing store to promote products through your GoElev8 funnel.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {PLATFORMS.map((platform) => {
            const integration = integrations.find((i) => i.platform === platform.id);
            return (
              <div key={platform.id} style={{
                border: '1px solid #E5E7EB', borderRadius: 10, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: integration?.status === 'active' ? '#10B981' : '#D1D5DB',
                  }} />
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{platform.name}</h3>
                </div>
                {integration?.status === 'active' ? (
                  <>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>
                      {integration.product_count} products
                    </span>
                    {integration.last_sync_at && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        Last sync: {new Date(integration.last_sync_at).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (platform.id === 'squarespace' || platform.id === 'wix') {
                        // OAuth flow — redirect
                        const oauthBase = platform.id === 'squarespace'
                          ? 'https://login.squarespace.com/api/1/login/oauth/provider/authorize'
                          : 'https://www.wix.com/installer/install';
                        window.location.href = `${oauthBase}?client_id=${platform.id === 'squarespace' ? process.env.NEXT_PUBLIC_SQUARESPACE_CLIENT_ID : process.env.NEXT_PUBLIC_WIX_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/site-connect/' + platform.id + '/callback')}&scope=read_write&response_type=code`;
                      } else {
                        setConnectPlatform(platform.id);
                      }
                    }}
                    style={{
                      background: platform.color, color: '#fff', border: 'none',
                      borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, marginTop: 'auto',
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Add Product</h2>
            <form onSubmit={handleAddProduct}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Icon Emoji</label>
                  <input
                    type="text"
                    value={newProduct.icon_emoji}
                    onChange={(e) => setNewProduct({ ...newProduct, icon_emoji: e.target.value })}
                    placeholder="📦"
                    maxLength={2}
                    style={{ width: 60, padding: 8, borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 24, textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Product Name</label>
                  <input
                    type="text" required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Price ($)</label>
                  <input
                    type="number" step="0.01" min="0.50" required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Type</label>
                  <select
                    value={newProduct.product_type}
                    onChange={(e) => setNewProduct({ ...newProduct, product_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                  >
                    <option value="digital">Digital</option>
                    <option value="physical">Physical</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Store Modal */}
      {connectPlatform && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              Connect {PLATFORMS.find((p) => p.id === connectPlatform)?.name}
            </h2>
            <form onSubmit={handleConnectStore}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {connectPlatform === 'shopify' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Shopify Domain</label>
                      <input
                        type="text" required placeholder="your-store.myshopify.com"
                        value={connectForm.shopify_domain || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, shopify_domain: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Storefront Access Token</label>
                      <input
                        type="password" required
                        value={connectForm.shopify_token || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, shopify_token: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                  </>
                )}
                {connectPlatform === 'woocommerce' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Store URL</label>
                      <input
                        type="url" required placeholder="https://your-store.com"
                        value={connectForm.store_url || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, store_url: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Consumer Key</label>
                      <input
                        type="password" required
                        value={connectForm.consumer_key || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, consumer_key: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Consumer Secret</label>
                      <input
                        type="password" required
                        value={connectForm.consumer_secret || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, consumer_secret: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                  </>
                )}
                {connectPlatform === 'bigcommerce' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Store Hash</label>
                      <input
                        type="text" required
                        value={connectForm.store_hash || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, store_hash: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>API Access Token</label>
                      <input
                        type="password" required
                        value={connectForm.bc_token || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, bc_token: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                      />
                    </div>
                  </>
                )}
                {connectPlatform === 'manual' && (
                  <p style={{ color: '#6B7280', fontSize: 14 }}>
                    Add products manually from the product grid above using the "Add Product" button.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button" onClick={() => { setConnectPlatform(null); setConnectForm({}); }}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                {connectPlatform !== 'manual' && (
                  <button
                    type="submit"
                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Connect Store
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
