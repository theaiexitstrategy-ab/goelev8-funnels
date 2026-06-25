// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/onboard/save-step
//   Body: { token, step, data }
//
// Validates the resume_token, upserts the partial client_info patch, and
// bumps clients.onboarding_step to the highest step they've completed.
// `data` is a shallow object mapped 1:1 onto client_info columns.

import { createServiceClient } from '@/lib/db/supabase-service';

const ALLOWED: Record<number, string[]> = {
  1: ['business_name','tagline','phone','address','city','state','zip','booking_url','social_instagram','social_facebook','social_tiktok'],
  2: ['primary_color','secondary_color','font_preference','brand_notes'],
  3: [], // step 3 only handles file uploads — no scalar fields
  4: [], // step 4 only updates client_assets
  5: ['services'],
  6: ['domain_preference','keywords'],
};

export async function POST(req: Request) {
  try {
    const { token, step, data } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });
    const n = Number(step);
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      return Response.json({ error: 'Invalid step' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: client, error: lookupErr } = await supabase
      .from('clients')
      .select('id, onboarding_step')
      .eq('resume_token', token)
      .maybeSingle();
    if (lookupErr || !client) {
      return Response.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Whitelist + project the patch.
    const allowed = ALLOWED[n] ?? [];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data && Object.prototype.hasOwnProperty.call(data, key)) {
        patch[key] = data[key];
      }
    }

    // Upsert into client_info if there's anything to patch.
    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString();
      const { error: upErr } = await supabase
        .from('client_info')
        .upsert({ client_id: client.id, ...patch }, { onConflict: 'client_id' });
      if (upErr) {
        console.error('[onboard/save-step] upsert client_info failed:', upErr.message);
        return Response.json({ error: 'Could not save step' }, { status: 500 });
      }
    }

    // Advance onboarding_step (never go backward).
    const newStep = Math.max(client.onboarding_step ?? 0, n);
    await supabase
      .from('clients')
      .update({ onboarding_step: newStep, onboarding_status: 'in_progress' })
      .eq('id', client.id);

    return Response.json({ ok: true, next_step: n + 1 });
  } catch (err: any) {
    console.error('[onboard/save-step]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
