// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';

const connectSchema = z.object({
  platform: z.enum(['shopify', 'squarespace', 'wix', 'woocommerce', 'bigcommerce']),
  // Shopify
  shopify_domain: z.string().optional(),
  shopify_token: z.string().optional(),
  // WooCommerce
  store_url: z.string().url().optional(),
  consumer_key: z.string().optional(),
  consumer_secret: z.string().optional(),
  // BigCommerce
  store_hash: z.string().optional(),
  bc_token: z.string().optional(),
  // Squarespace/Wix: handled via OAuth callback (separate routes)
});

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(publicArcjet, req);
    if (limited) return limited;
    validateCSRF(req);

    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });

    const { platform } = parsed.data;
    const service = createServiceClient();

    // Test the connection before storing
    let productCount = 0;
    try {
      if (platform === 'shopify') {
        const res = await fetch(
          `https://${parsed.data.shopify_domain}/api/2024-01/products/count.json`,
          { headers: { 'X-Shopify-Storefront-Access-Token': parsed.data.shopify_token! } }
        );
        const data = await res.json();
        productCount = data.count || 0;
      } else if (platform === 'woocommerce') {
        const credentials = btoa(`${parsed.data.consumer_key}:${parsed.data.consumer_secret}`);
        const res = await fetch(`${parsed.data.store_url}/wp-json/wc/v3/products?per_page=1`, {
          headers: { Authorization: `Basic ${credentials}` }
        });
        if (!res.ok) throw new Error('WooCommerce connection failed');
        const total = res.headers.get('X-WP-Total');
        productCount = parseInt(total || '0');
      }
    } catch {
      return Response.json({ error: 'Could not connect to store. Check your credentials.' }, { status: 400 });
    }

    // Upsert integration
    await service.from('store_integrations').upsert({
      user_id: session.user.id,
      platform,
      store_url: parsed.data.store_url,
      access_token: parsed.data.shopify_token || parsed.data.bc_token,
      consumer_key: parsed.data.consumer_key,
      consumer_secret: parsed.data.consumer_secret,
      store_hash: parsed.data.store_hash,
      product_count: productCount,
      status: 'active',
    }, { onConflict: 'user_id,platform' });

    // Trigger product sync (non-blocking)
    service.functions.invoke('sync-store-products', {
      body: { user_id: session.user.id, platform }
    }).catch(console.error);

    return Response.json({ success: true, product_count: productCount });

  } catch (err) {
    console.error('[connect-store]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
