// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Per-client onboarding sales page at /onboard/<slug>. Pulls everything
// from lib/onboarding-configs.ts so adding a new client is one config entry.

import { notFound } from 'next/navigation';
import { getConfig } from '@/lib/onboarding-configs';
import OnboardSalesClient from './OnboardSalesClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cfg = getConfig(slug);
  if (!cfg) return { title: 'Onboarding | GoElev8.ai' };
  return {
    title: `${cfg.businessName} — Get Started | GoElev8.ai`,
    description: cfg.subhead,
  };
}

export default async function OnboardSalesPage({ params }: Props) {
  const { slug } = await params;
  const cfg = getConfig(slug);
  if (!cfg) notFound();
  return <OnboardSalesClient cfg={cfg} />;
}
