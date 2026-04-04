// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { user_id, platform } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: integration } = await supabase
    .from('store_integrations')
    .select('*').eq('user_id', user_id).eq('platform', platform).single();
  if (!integration) return new Response('Integration not found', { status: 404 });

  let products: any[] = [];

  try {
    if (platform === 'shopify') {
      const res = await fetch(
        `https://${integration.store_url}/api/2024-01/products.json?limit=250`,
        { headers: { 'X-Shopify-Storefront-Access-Token': integration.access_token } }
      );
      const data = await res.json();
      products = (data.products || []).map((p: any) => ({
        user_id,
        name: p.title,
        description: p.body_html?.replace(/<[^>]*>/g, '') || '',
        price_cents: Math.round(parseFloat(p.variants?.[0]?.price || '0') * 100),
        external_url: `https://${integration.store_url}/products/${p.handle}`,
        image_url: p.images?.[0]?.src || null,
        platform: 'shopify',
        is_active: p.status === 'active',
      }));
    } else if (platform === 'woocommerce') {
      const credentials = btoa(`${integration.consumer_key}:${integration.consumer_secret}`);
      const res = await fetch(`${integration.store_url}/wp-json/wc/v3/products?per_page=100`, {
        headers: { Authorization: `Basic ${credentials}` }
      });
      const data = await res.json();
      products = (data || []).map((p: any) => ({
        user_id,
        name: p.name,
        description: p.short_description?.replace(/<[^>]*>/g, '') || '',
        price_cents: Math.round(parseFloat(p.price || '0') * 100),
        external_url: p.permalink,
        image_url: p.images?.[0]?.src || null,
        platform: 'woocommerce',
        is_active: p.status === 'publish',
      }));
    }
    // BigCommerce, Squarespace, Wix patterns to be added

    // Upsert products (keyed by user_id + external_url)
    if (products.length > 0) {
      await supabase.from('products').upsert(products, { onConflict: 'user_id,external_url' });
    }

    await supabase.from('store_integrations').update({
      product_count: products.length,
      last_sync_at: new Date().toISOString(),
    }).eq('id', integration.id);

    return new Response(JSON.stringify({ synced: products.length }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    await supabase.from('store_integrations').update({ status: 'error' }).eq('id', integration.id);
    return new Response('Sync failed', { status: 500 });
  }
});
