// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/leads/roqbody
//
// Captures leads from goelev8.ai/roq (the ROQ Body homepage) into the
// existing public.leads table on Supabase project bnkoqybkmwtrlorhowyv.
//
// Behavior:
//   1. Looks up clients.id for slug 'roqbody' so leads.client_id is set
//      to the real uuid, not the slug string.
//   2. Inserts only into columns known to exist in public.leads (schema
//      pre-verified for this project — no live schema query on every
//      request).
//   3. Always returns HTTP 200, even on internal error, so the form never
//      shows a failure state to the buyer. Errors are logged for debugging.

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    // fall through with empty body; validation below returns success:false
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
  const source = typeof body.source === 'string' && body.source
    ? body.source
    : 'roqbody-site';

  if (!name || !phone) {
    console.warn('[leads/roqbody] rejected — missing name or phone');
    return Response.json({ success: false, error: 'Missing name or phone' });
  }

  try {
    const supabase = serviceClient();

    // Step 1: resolve client_id from slug
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', 'roqbody')
      .limit(1)
      .maybeSingle();

    if (clientErr) {
      console.error('[leads/roqbody] clients lookup failed:', clientErr.message);
      return Response.json({ success: false, error: clientErr.message });
    }
    if (!client?.id) {
      // No roqbody client row yet. Still return 200 so the form doesn't
      // surface an error to Coach Q's lead. Aaron will find these in the
      // Vercel logs and can backfill.
      console.error('[leads/roqbody] no clients row for slug=roqbody');
      return Response.json({ success: false, error: 'client not provisioned' });
    }

    // Step 2: insert into leads. Only include columns we know exist in
    // public.leads for project bnkoqybkmwtrlorhowyv (schema verified).
    const now = new Date().toISOString();
    const insertRow = {
      client_id: client.id,
      name,
      phone,
      source,
      funnel: 'roqbody',
      intent: goal || '',
      notes: goal || '',
      status: 'new',
      lead_status: 'new',
      lead_source: source,
      payload: {
        raw: body,
        page: 'goelev8.ai/roq',
        submitted_at: now,
      },
    };

    const { error: insErr } = await supabase.from('leads').insert(insertRow);
    if (insErr) {
      console.error('[leads/roqbody] insert failed:', insErr.message, insErr.details);
      return Response.json({ success: false, error: insErr.message });
    }

    console.log(`[leads/roqbody] captured lead name=${name} phone=${phone}`);
    return Response.json({ success: true });
  } catch (err) {
    console.error('[leads/roqbody] unexpected error:', err?.message ?? err);
    return Response.json({ success: false, error: err?.message ?? 'internal' });
  }
}
