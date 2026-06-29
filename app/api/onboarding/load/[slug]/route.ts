// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// GET /api/onboarding/load/[slug]
//
// Reads the existing staging state for a client so the conversational agent
// can resume exactly where the buyer left off. There's no onboarding_briefs
// table — we reassemble the brief from clients + client_info + tenants +
// the tagged JSON blob stashed in client_info.brand_notes.
//
// Auth: x-resume-token header must match clients.resume_token for this slug.

import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { authenticateResumeToken } from '@/lib/onboarding-runtime';
import { getConfig, getFlags } from '@/lib/onboarding-configs';

const STAGED_TAG = '[GOELEV8_STAGED]:';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug;
  const token = req.headers.get('x-resume-token') ?? req.nextUrl.searchParams.get('token');
  const supabase = createServiceClient();
  const auth = await authenticateResumeToken(supabase, slug, token);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const client = auth.client;
  const cfg = getConfig(client.onboarding_config_slug ?? slug);
  if (!cfg) return Response.json({ error: 'Unknown config' }, { status: 500 });

  const [info, tenant] = await Promise.all([
    supabase.from('client_info').select('*').eq('client_id', client.id).maybeSingle(),
    supabase.from('tenants').select('*').eq('client_id', client.id).maybeSingle(),
  ]);

  const stagedBlob = extractStaged(info.data?.brand_notes ?? '');

  return Response.json({
    client: {
      id: client.id,
      slug: client.slug,
      first_name: deriveFirstName(client.name),
      name: client.name,
      email: client.email,
      business_name: client.business_name,
      onboarding_step: client.onboarding_step ?? 1,
      onboarding_status: client.onboarding_status ?? 'onboarding',
    },
    config: {
      slug: cfg.slug,
      client_name: cfg.clientName,
      owner_name: cfg.ownerName,
      business_name: cfg.businessName,
      tier: cfg.tier ?? cfg.plan,
      accent_color: cfg.accentColor,
      flags: getFlags(cfg),
      known_info: cfg.knownInfo ?? {},
      transaction_fee_label: cfg.transactionFeeLabel,
    },
    staged: {
      tenant: tenant.data ?? null,
      client_info: info.data ?? null,
      blob: stagedBlob,
    },
  });
}

function extractStaged(brandNotes: string): Record<string, any> {
  if (!brandNotes?.startsWith(STAGED_TAG)) return {};
  try {
    return JSON.parse(brandNotes.slice(STAGED_TAG.length));
  } catch {
    return {};
  }
}

function deriveFirstName(name: string | null): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}
