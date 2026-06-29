// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/provisioning/trigger
//
// Server-only entrypoint that kicks off the provisioning run. Called from
// /api/onboarding/complete when the buyer signs off on the review.
//
// Auth: requires x-internal-key header matching INTERNAL_API_KEY env var.
// Body: { client_id: uuid, slug?: string, config_slug?: string }
//
// Implementation note: we fire the /run sibling endpoint and DO NOT await
// its completion — the run can take a few seconds and we want this trigger
// to return immediately so the caller (the chat completion route) isn't
// blocked.

import { NextRequest } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.goelev8.ai';

export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-internal-key') ?? '';
  const expected = process.env.INTERNAL_API_KEY ?? '';
  if (!expected) {
    console.error('[provisioning/trigger] INTERNAL_API_KEY not configured — refusing');
    return Response.json({ error: 'Not configured' }, { status: 500 });
  }
  if (provided !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { client_id?: string; slug?: string; config_slug?: string }
    | null;
  if (!body?.client_id) {
    return Response.json({ error: 'client_id required' }, { status: 400 });
  }

  // Fire the run, don't wait for it.
  void fetch(`${APP_URL}/api/provisioning/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': expected,
    },
    body: JSON.stringify(body),
  }).catch((e) => console.error('[provisioning/trigger] run fetch failed:', e?.message ?? e));

  return Response.json({ queued: true });
}
