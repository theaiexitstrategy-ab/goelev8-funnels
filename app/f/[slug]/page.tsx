// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import { notFound } from 'next/navigation';
import FunnelClient from './FunnelClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels')
    .select('hero_headline, hero_subheadline, name, industry, city')
    .eq('slug', slug)
    .single();

  if (!funnel) return { title: 'Page Not Found' };

  const title = funnel.hero_headline || funnel.name || 'GoElev8.AI';
  const description = funnel.hero_subheadline || `${funnel.industry || 'Business'} in ${funnel.city || 'your area'}`;

  return {
    title: `${title} | GoElev8.AI`,
    description,
    openGraph: { title, description },
  };
}

export default async function FunnelPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: funnel } = await supabase
    .from('funnels')
    .select(`
      id, slug, name, accent_color, user_id,
      hero_headline, hero_subheadline, offer_text, cta_text,
      feature_1_title, feature_1_body,
      feature_2_title, feature_2_body,
      feature_3_title, feature_3_body,
      feature_4_title, feature_4_body,
      industry, city, is_claimed, expires_at, is_active
    `)
    .eq('slug', slug)
    .single();

  if (!funnel) notFound();

  // Check if expired (unclaimed pages expire after 24h)
  const isExpired = !funnel.is_claimed && funnel.expires_at && new Date(funnel.expires_at) < new Date();

  return (
    <FunnelClient
      funnel={{
        id: funnel.id,
        slug: funnel.slug,
        name: funnel.name || '',
        accent_color: funnel.accent_color || '#00CFFF',
        hero_headline: funnel.hero_headline || '',
        hero_subheadline: funnel.hero_subheadline || '',
        offer_text: funnel.offer_text || '',
        cta_text: funnel.cta_text || 'GET STARTED →',
        feature_1_title: funnel.feature_1_title || '',
        feature_1_body: funnel.feature_1_body || '',
        feature_2_title: funnel.feature_2_title || '',
        feature_2_body: funnel.feature_2_body || '',
        feature_3_title: funnel.feature_3_title || '',
        feature_3_body: funnel.feature_3_body || '',
        feature_4_title: funnel.feature_4_title || '',
        feature_4_body: funnel.feature_4_body || '',
        industry: funnel.industry || 'other',
        city: funnel.city || '',
        is_claimed: funnel.is_claimed ?? false,
        is_expired: isExpired ?? false,
        expires_at: funnel.expires_at || null,
      }}
    />
  );
}
