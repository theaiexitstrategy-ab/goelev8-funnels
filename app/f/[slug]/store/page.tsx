// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import { notFound } from 'next/navigation';
import StoreClient from './StoreClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('name').eq('slug', slug).single();

  return {
    title: funnel ? `${funnel.name} - Store` : 'Store',
    description: funnel ? `Shop products from ${funnel.name}` : 'Product store',
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Load funnel
  const { data: funnel } = await supabase
    .from('funnels')
    .select('id, name, slug, accent_color, user_id')
    .eq('slug', slug)
    .single();

  if (!funnel) notFound();

  // Load active products for this user
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price_cents, product_type, icon_emoji, image_url, external_url, platform, is_active')
    .eq('user_id', funnel.user_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <StoreClient
      funnel={{
        name: funnel.name,
        slug: funnel.slug,
        accent_color: funnel.accent_color || '#2563EB',
      }}
      products={products || []}
    />
  );
}
