// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Public merch storefront at goelev8.ai/store/<client-slug>. Reads from the
// existing merch_products catalog (the actively-used shop schema, ~10 rows
// across iSlay Studios, WillPower Fitness Factory, and The Flex Facility).
//
// Buy flow in Phase 1 hands off to the seller's existing Stripe Payment Link
// when merch_products.payment_link is populated. Products without a payment
// link render a "Coming Soon" state — native checkout is Phase 2 work.

import { createServiceClient } from '@/lib/db/supabase-service';
import { notFound } from 'next/navigation';
import StoreClient, { type MerchProduct, type StoreClientInfo } from './StoreClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: client } = await supabase
    .from('clients').select('business_name, name').eq('slug', slug).single();
  const name = client?.business_name || client?.name;
  return {
    title: name ? `${name} — Store` : 'Store',
    description: name ? `Shop merch from ${name}` : 'Merch store',
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, slug, name, business_name, brand_color, logo_url')
    .eq('slug', slug)
    .single();

  if (!client) notFound();

  const { data: rows } = await supabase
    .from('merch_products')
    .select('id, product_key, name, description, image_url, base_price_cents, compare_at_price_cents, payment_link, sort_order')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const products: MerchProduct[] = (rows ?? []).map((p) => ({
    id: p.id,
    productKey: p.product_key,
    name: p.name,
    description: p.description,
    imageUrl: p.image_url,
    priceCents: p.base_price_cents,
    compareAtCents: p.compare_at_price_cents,
    paymentLink: p.payment_link,
  }));

  const info: StoreClientInfo = {
    slug: client.slug,
    name: client.business_name || client.name || client.slug,
    accentColor: client.brand_color || '#00CFFF',
    logoUrl: client.logo_url,
  };

  return <StoreClient client={info} products={products} />;
}
