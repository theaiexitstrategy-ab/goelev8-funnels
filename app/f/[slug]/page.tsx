// app/f/[slug]/page.tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/db/supabase-service';
import { buildFunnelPage } from '@/lib/templates/build-page';

export const revalidate = 60; // Cache for 60 seconds, revalidate in background

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('business_name, headline, offer')
    .eq('slug', params.slug).eq('is_active', true).single();

  return {
    title: funnel?.business_name || 'GoElev8.ai',
    description: funnel?.headline || 'AI-powered lead capture',
  };
}

export default async function FunnelPage({ params }: Props) {
  const supabase = createServiceClient();
  const { data: funnel } = await supabase
    .from('funnels').select('*').eq('slug', params.slug).eq('is_active', true).single();

  if (!funnel) notFound();

  // Track page view (non-blocking)
  supabase.from('funnel_analytics').insert({
    funnel_id: funnel.id,
    user_id: funnel.user_id,
    event_type: 'page_view',
    metadata: { slug: params.slug },
  }).then(() => {}).catch(() => {});

  // Build HTML from template + funnel data
  const html = await buildFunnelPage({
    ...funnel,
    slug: params.slug,
  });

  // Render as raw HTML — the template IS the page
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ margin: 0, padding: 0 }}
    />
  );
}
