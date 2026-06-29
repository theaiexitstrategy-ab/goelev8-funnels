// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Per-client onboarding sales page at /onboard/<slug>. Originally built for
// Leslie's flow ("locs-and-wellness"). Newer clients (roqbody, afff) get
// their own bespoke landing pages at /qsetup, /affsetup, etc., so we
// redirect those slugs to their canonical URL rather than render this
// generic template — avoids two sales pages with two different buy buttons
// for the same client.

import { notFound, redirect } from 'next/navigation';
import { getConfig } from '@/lib/onboarding-configs';
import OnboardSalesClient from './OnboardSalesClient';

type Props = { params: Promise<{ slug: string }> };

const CANONICAL_REDIRECTS: Record<string, string> = {
  roqbody: '/qsetup',
  afff: '/affsetup',
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (CANONICAL_REDIRECTS[slug]) return { title: 'Redirecting…' };
  const cfg = getConfig(slug);
  if (!cfg) return { title: 'Onboarding | GoElev8.ai' };
  return {
    title: `${cfg.businessName} — Get Started | GoElev8.ai`,
    description: cfg.subhead,
  };
}

export default async function OnboardSalesPage({ params }: Props) {
  const { slug } = await params;
  const canonical = CANONICAL_REDIRECTS[slug];
  if (canonical) redirect(canonical);
  const cfg = getConfig(slug);
  if (!cfg) notFound();
  return <OnboardSalesClient cfg={cfg} />;
}
