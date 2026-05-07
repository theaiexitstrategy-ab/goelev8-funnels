'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const GuestProfileSchema = z.object({
  display_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(40),
  city: z.string().trim().max(60).optional(),
  ig_handle: z.string().trim().max(40).optional(),
  tt_handle: z.string().trim().max(40).optional(),
  sc_handle: z.string().trim().max(40).optional(),
  x_handle: z.string().trim().max(40).optional(),
});

function clean(s: FormDataEntryValue | null): string | undefined {
  const v = (s ?? '').toString().trim().replace(/^@/, '');
  return v.length ? v : undefined;
}

export async function saveGuestProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const parsed = GuestProfileSchema.safeParse({
    display_name: formData.get('display_name')?.toString() ?? '',
    city: clean(formData.get('city')),
    ig_handle: clean(formData.get('ig_handle')),
    tt_handle: clean(formData.get('tt_handle')),
    sc_handle: clean(formData.get('sc_handle')),
    x_handle: clean(formData.get('x_handle')),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Stamp city onto hush_users (used for city feed filtering) and write
  // the social profile.
  const { error: userErr } = await supabase
    .from('hush_users')
    .update({ city: parsed.data.city })
    .eq('id', user.id);
  if (userErr) {
    console.error('[onboarding/guest] user update failed:', userErr);
    return { error: 'Could not save profile. Try again.' };
  }

  const { error: profileErr } = await supabase
    .from('hush_profiles')
    .upsert(
      {
        user_id: user.id,
        display_name: parsed.data.display_name,
        ig_handle: parsed.data.ig_handle ?? null,
        tt_handle: parsed.data.tt_handle ?? null,
        sc_handle: parsed.data.sc_handle ?? null,
        x_handle: parsed.data.x_handle ?? null,
      },
      { onConflict: 'user_id' }
    );
  if (profileErr) {
    console.error('[onboarding/guest] profile upsert failed:', profileErr);
    return { error: 'Could not save profile. Try again.' };
  }

  redirect('/hush/app/feed');
}
