// app/f/[slug]/store/page.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';

export const revalidate = 60;

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('business_name')
    .eq('slug', params.slug).eq('is_active', true).single();

  return {
    title: funnel ? `Shop — ${funnel.business_name}` : 'Shop',
    description: 'Browse products and services',
  };
}

export default async function StorePage({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('*').eq('slug', params.slug).eq('is_active', true).single();

  if (!funnel) notFound();
  if (!funnel.store_enabled) notFound();

  // Load products for this user
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', funnel.user_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const accent = funnel.accent_color || '#00CFFF';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#050a12', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a1a2e' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: accent }}>
            {funnel.business_name}
          </span>
          <a href={`/f/${params.slug}`} style={{ color: accent, textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back
          </a>
        </nav>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', margin: '0 0 32px' }}>
            Products &amp; Services
          </h1>

          {(!products || products.length === 0) ? (
            <p style={{ opacity: 0.5 }}>No products available yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {products.map((product: any) => (
                <div key={product.id} style={{ background: '#0d1117', border: '1px solid #1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', margin: '0 0 8px' }}>
                      {product.name}
                    </h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: '0 0 16px' }}>
                      {product.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: accent }}>
                        ${(product.price_cents / 100).toFixed(2)}
                      </span>
                      <button
                        data-product-id={product.id}
                        style={{ padding: '10px 20px', background: accent, color: '#000', border: 'none', borderRadius: 2,
                                 fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', cursor: 'pointer' }}>
                        BUY NOW
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GoElev8.ai badge */}
        <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 999 }}>
          <a href="https://goelev8.ai/powered-by" target="_blank" rel="noopener"
             style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.8)',
                      border: '1px solid rgba(0,207,255,.3)', borderRadius: 2, padding: '5px 10px',
                      textDecoration: 'none', fontFamily: 'monospace', fontSize: 10, color: '#00CFFF' }}>
            Powered by GoElev8.ai
          </a>
        </div>
      </body>
    </html>
  );
}
