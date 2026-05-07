'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ModelSchema = z.object({
  stage_name: z.string().trim().min(2, 'Stage name must be at least 2 characters').max(40),
  city: z.string().trim().max(60).optional(),
  ig_handle: z.string().trim().max(40).optional(),
  of_url: z
    .string()
    .trim()
    .url('OnlyFans link must be a full URL')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

function clean(s: FormDataEntryValue | null): string | undefined {
  const v = (s ?? '').toString().trim().replace(/^@/, '');
  return v.length ? v : undefined;
}

export async function saveModelProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const parsed = ModelSchema.safeParse({
    stage_name: formData.get('stage_name')?.toString() ?? '',
    city: clean(formData.get('city')),
    ig_handle: clean(formData.get('ig_handle')),
    of_url: clean(formData.get('of_url')),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Stamp stage_name + city onto the user row.
  const { error: userErr } = await supabase
    .from('hush_users')
    .update({
      stage_name: parsed.data.stage_name,
      city: parsed.data.city,
    })
    .eq('id', user.id);
  if (userErr) {
    console.error('[onboarding/model] user update failed:', userErr);
    return { error: 'Could not save profile. Try again.' };
  }

  // Ensure a hush_models row exists. New models start with the 'rising'
  // badge — featured/elite are earned via verification (separate flow).
  const { error: modelErr } = await supabase
    .from('hush_models')
    .upsert(
      {
        user_id: user.id,
        badge: 'rising',
        is_available: true,
      },
      { onConflict: 'user_id' }
    );
  if (modelErr) {
    console.error('[onboarding/model] model upsert failed:', modelErr);
    return { error: 'Could not save model profile. Try again.' };
  }

  // Profile (display_name = stage_name for models, OF link).
  const { error: profileErr } = await supabase
    .from('hush_profiles')
    .upsert(
      {
        user_id: user.id,
        display_name: parsed.data.stage_name,
        ig_handle: parsed.data.ig_handle ?? null,
        of_url: parsed.data.of_url ?? null,
      },
      { onConflict: 'user_id' }
    );
  if (profileErr) {
    console.error('[onboarding/model] profile upsert failed:', profileErr);
    return { error: 'Could not save profile. Try again.' };
  }

  // Stripe Connect onboarding lands in the next phase.
  redirect('/hush/app/profile');
}
