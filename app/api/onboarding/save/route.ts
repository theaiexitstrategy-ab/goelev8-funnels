// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/onboarding/save
//
// Saves partial onboarding answers after each conversational step. Schema
// has no onboarding_briefs table, so we stage directly into the canonical
// destination tables:
//
//   step 1 (contact)        → clients.email, tenants.owner_phone, client_settings.owner_phone
//   step 2 (business basics)→ client_info (address, hours, years_in_business via brand_notes JSON)
//   step 3 (brand)          → tenants.logo_url + brand_color + client_info brand fields
//   step 4 (services)       → tenants.services + client_info.services
//   step 5 (social proof)   → client_info.brand_notes (tagged JSON blob)
//   step 6/7 (agent config) → client_info.brand_notes (tagged JSON blob)
//   step 8 (booking prefs)  → tenants.availability + booking_blocked_dates
//
// Request body: { step: number, payload: object }
// Auth: resume_token must be in header `x-resume-token` AND match
//       clients.resume_token for ?slug=... query param.

import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { authenticateResumeToken } from '@/lib/onboarding-runtime';

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });
  const token = req.headers.get('x-resume-token');
  const supabase = createServiceClient();
  const auth = await authenticateResumeToken(supabase, slug, token);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let body: { step?: number; payload?: Record<string, any> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const step = Number(body.step);
  const payload = body.payload ?? {};
  if (!Number.isFinite(step) || step < 1 || step > 9) {
    return Response.json({ error: 'step must be 1-9' }, { status: 400 });
  }

  const client = auth.client;

  // ── advance clients.onboarding_step (monotonic) ──
  const newStep = Math.max(client.onboarding_step ?? 0, step);
  await supabase
    .from('clients')
    .update({ onboarding_step: newStep })
    .eq('id', client.id);

  // ── dispatch by step ──
  try {
    await applyStep(supabase, client.id, client.slug, step, payload);
  } catch (err: any) {
    console.error('[onboarding/save] step apply failed:', err?.message ?? err);
    return Response.json({ error: 'persist failed' }, { status: 500 });
  }

  return Response.json({ ok: true, step: newStep });
}

async function applyStep(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  clientSlug: string,
  step: number,
  payload: Record<string, any>,
): Promise<void> {
  switch (step) {
    case 1: {
      // Contact: phone goes to tenants.owner_phone + client_settings.owner_phone.
      if (typeof payload.owner_phone === 'string') {
        await upsertTenant(supabase, clientId, clientSlug, { owner_phone: payload.owner_phone });
        await upsertClientSettings(supabase, clientSlug, { owner_phone: payload.owner_phone });
      }
      if (typeof payload.email === 'string') {
        await supabase.from('clients').update({ email: payload.email }).eq('id', clientId);
        await upsertTenant(supabase, clientId, clientSlug, { owner_email: payload.email });
        await upsertClientSettings(supabase, clientSlug, { owner_email: payload.email });
      }
      return;
    }
    case 2: {
      // Business basics. address/city/state/zip → client_info; hours+years → brand_notes blob.
      const ciPatch: Record<string, any> = {};
      for (const k of ['address', 'city', 'state', 'zip', 'phone', 'tagline']) {
        if (typeof payload[k] === 'string') ciPatch[k] = payload[k];
      }
      await upsertClientInfo(supabase, clientId, ciPatch);
      await mergeBrandNotesBlob(supabase, clientId, {
        business_basics: {
          hours: payload.hours ?? null,
          years_in_business: payload.years_in_business ?? null,
          service_area: payload.service_area ?? null,
        },
      });
      return;
    }
    case 3: {
      // Brand. logo_url + brand_color → tenants. primary/secondary → client_info.
      const tPatch: Record<string, any> = {};
      if (typeof payload.logo_url === 'string') tPatch.logo_url = payload.logo_url;
      if (typeof payload.brand_color === 'string') tPatch.brand_color = payload.brand_color;
      if (Object.keys(tPatch).length) await upsertTenant(supabase, clientId, clientSlug, tPatch);

      const ciPatch: Record<string, any> = {};
      if (typeof payload.primary_color === 'string') ciPatch.primary_color = payload.primary_color;
      if (typeof payload.secondary_color === 'string') ciPatch.secondary_color = payload.secondary_color;
      if (typeof payload.website === 'string') ciPatch.domain_preference = payload.website;
      await upsertClientInfo(supabase, clientId, ciPatch);
      return;
    }
    case 4: {
      // Services array. Normalize to array of strings.
      const services = Array.isArray(payload.services)
        ? payload.services
        : typeof payload.services === 'string'
        ? splitServices(payload.services)
        : [];
      if (services.length) {
        await upsertTenant(supabase, clientId, clientSlug, { services });
        await upsertClientInfo(supabase, clientId, { services });
      }
      return;
    }
    case 5: {
      await mergeBrandNotesBlob(supabase, clientId, {
        social_proof: {
          reviews: payload.reviews ?? null,
          testimonials: payload.testimonials ?? null,
          press: payload.press ?? null,
          certifications: payload.certifications ?? null,
        },
      });
      return;
    }
    case 6: {
      await mergeBrandNotesBlob(supabase, clientId, {
        lead_agent_config: {
          primary_cta: payload.primary_cta ?? null,
          common_questions: payload.common_questions ?? null,
          never_say: payload.never_say ?? null,
        },
      });
      return;
    }
    case 7: {
      await mergeBrandNotesBlob(supabase, clientId, {
        voice_agent_config: {
          greeting: payload.greeting ?? null,
          required_intake: payload.required_intake ?? null,
          never_book: payload.never_book ?? null,
          transfer_number: payload.transfer_number ?? null,
        },
      });
      // vapi_api_key placeholder so Aaron can flip it on later.
      await supabase.from('clients').update({ vapi_api_key: '' }).eq('id', clientId);
      return;
    }
    case 8: {
      // Booking prefs. availability + blocked dates.
      if (payload.availability) {
        await upsertTenant(supabase, clientId, clientSlug, { availability: payload.availability });
      }
      const blocked: string[] = Array.isArray(payload.blocked_dates) ? payload.blocked_dates : [];
      for (const iso of blocked) {
        await supabase
          .from('booking_blocked_dates')
          .upsert({ client_id: clientId, blocked_date: iso }, { onConflict: 'client_id,blocked_date' });
      }
      await mergeBrandNotesBlob(supabase, clientId, {
        booking_prefs: {
          appt_length_minutes: payload.appt_length_minutes ?? null,
          buffer_minutes: payload.buffer_minutes ?? null,
        },
      });
      return;
    }
    case 9: {
      // Final review confirmation — flips status. The /complete sibling
      // route is what actually triggers provisioning; this just records that
      // the user confirmed everything looked right.
      await mergeBrandNotesBlob(supabase, clientId, {
        review_confirmed_at: new Date().toISOString(),
      });
      return;
    }
  }
}

function splitServices(raw: string): string[] {
  return raw
    .split(/\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function upsertTenant(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  clientSlug: string,
  patch: Record<string, any>,
): Promise<void> {
  // tenants.client_id has a uniqueness expectation in this codebase. Upsert
  // by client_id to keep us idempotent.
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) {
    await supabase.from('tenants').update(patch).eq('id', existing.id);
  } else {
    await supabase.from('tenants').insert({
      client_id: clientId,
      slug: clientSlug,
      portal_url: `https://portal.goelev8.ai/${clientSlug}`,
      booking_url: `https://book.goelev8.ai/${clientSlug}`,
      ...patch,
    });
  }
}

async function upsertClientSettings(
  supabase: ReturnType<typeof createServiceClient>,
  clientSlug: string,
  patch: Record<string, any>,
): Promise<void> {
  // client_settings.client_id is TEXT, not uuid — we key on slug.
  const { data: existing } = await supabase
    .from('client_settings')
    .select('id')
    .eq('client_id', clientSlug)
    .maybeSingle();
  if (existing) {
    await supabase.from('client_settings').update(patch).eq('id', existing.id);
  } else {
    await supabase.from('client_settings').insert({ client_id: clientSlug, ...patch });
  }
}

async function upsertClientInfo(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  patch: Record<string, any>,
): Promise<void> {
  if (!Object.keys(patch).length) return;
  const { data: existing } = await supabase
    .from('client_info')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) {
    await supabase.from('client_info').update(patch).eq('id', existing.id);
  } else {
    await supabase.from('client_info').insert({ client_id: clientId, ...patch });
  }
}

// brand_notes is a text column. We piggyback structured staging data on it
// using a tag prefix so we can round-trip JSON without a new table:
//   "[GOELEV8_STAGED]:{...JSON...}"
// Provisioning reads this back when building tenants/client_settings rows.
const TAG = '[GOELEV8_STAGED]:';

async function mergeBrandNotesBlob(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  patch: Record<string, any>,
): Promise<void> {
  const { data: existing } = await supabase
    .from('client_info')
    .select('id, brand_notes')
    .eq('client_id', clientId)
    .maybeSingle();
  const prevBlob = existing?.brand_notes ? extractBlob(existing.brand_notes) : {};
  const merged = { ...prevBlob, ...patch };
  const serialized = `${TAG}${JSON.stringify(merged)}`;
  if (existing) {
    await supabase.from('client_info').update({ brand_notes: serialized }).eq('id', existing.id);
  } else {
    await supabase.from('client_info').insert({ client_id: clientId, brand_notes: serialized });
  }
}

function extractBlob(brandNotes: string): Record<string, any> {
  if (!brandNotes?.startsWith(TAG)) return {};
  try {
    return JSON.parse(brandNotes.slice(TAG.length));
  } catch {
    return {};
  }
}
