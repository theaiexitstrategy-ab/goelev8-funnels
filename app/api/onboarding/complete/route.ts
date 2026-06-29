// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/onboarding/complete
//
// Called by the chat agent after step 9 (review + confirm). Flips status,
// notifies Aaron, and fires the provisioning pipeline. The provisioning
// trigger is internal-keyed so the client cannot call it directly.
//
// Auth: x-resume-token header must match clients.resume_token for this slug.

import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { authenticateResumeToken, notifyAdminSMS } from '@/lib/onboarding-runtime';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.goelev8.ai';

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });
  const token = req.headers.get('x-resume-token');
  const supabase = createServiceClient();
  const auth = await authenticateResumeToken(supabase, slug, token);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const client = auth.client;

  await supabase
    .from('clients')
    .update({ onboarding_status: 'onboarding_complete', onboarding_step: 9 })
    .eq('id', client.id);

  // Fire-and-forget provisioning trigger. We don't await the full pipeline
  // because the client is still waiting on a HTTP response — provisioning
  // can run in the background.
  const internalKey = process.env.INTERNAL_API_KEY ?? '';
  void fetch(`${APP_URL}/api/provisioning/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
    body: JSON.stringify({ client_id: client.id, slug: client.slug, config_slug: client.onboarding_config_slug }),
  }).catch((e) => console.error('[onboarding/complete] trigger fetch failed:', e?.message ?? e));

  await notifyAdminSMS(
    `✅ ${client.business_name ?? client.slug} completed onboarding. Ready to provision. Check portal.goelev8.ai/admin`,
  );

  return Response.json({ ok: true });
}
