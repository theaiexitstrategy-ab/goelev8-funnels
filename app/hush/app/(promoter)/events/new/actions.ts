'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const NewEventSchema = z.object({
  title: z.string().trim().min(2, 'Event title is required').max(120),
  venue: z.string().trim().min(2, 'Venue is required').max(120),
  city: z.string().trim().min(2, 'City is required').max(60),
  address: z.string().trim().max(200).optional(),
  event_date: z
    .string()
    .min(1, 'Event date is required')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date'),
  doors_open: z.string().optional(),
  capacity: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((n) => n === undefined || (n > 0 && n < 100000), 'Capacity must be 1-99999'),
  age_restriction: z.string().trim().max(20).optional(),
  dress_code: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  posh_url: z
    .string()
    .trim()
    .url('Posh link must be a full URL')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

function clean(s: FormDataEntryValue | null): string | undefined {
  const v = (s ?? '').toString().trim();
  return v.length ? v : undefined;
}

export async function createEvent(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const parsed = NewEventSchema.safeParse({
    title: formData.get('title')?.toString() ?? '',
    venue: formData.get('venue')?.toString() ?? '',
    city: formData.get('city')?.toString() ?? '',
    address: clean(formData.get('address')),
    event_date: formData.get('event_date')?.toString() ?? '',
    doors_open: clean(formData.get('doors_open')),
    capacity: clean(formData.get('capacity')),
    age_restriction: clean(formData.get('age_restriction')) ?? '21+',
    dress_code: clean(formData.get('dress_code')),
    description: clean(formData.get('description')),
    posh_url: clean(formData.get('posh_url')),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { error: insertErr } = await supabase
    .from('hush_events')
    .insert({
      promoter_id: promoter.id,
      title: parsed.data.title,
      venue: parsed.data.venue,
      city: parsed.data.city,
      address: parsed.data.address ?? null,
      event_date: new Date(parsed.data.event_date).toISOString(),
      doors_open: parsed.data.doors_open
        ? new Date(parsed.data.doors_open).toISOString()
        : null,
      capacity: parsed.data.capacity ?? 200,
      age_restriction: parsed.data.age_restriction ?? '21+',
      dress_code: parsed.data.dress_code ?? null,
      description: parsed.data.description ?? null,
      posh_url: parsed.data.posh_url ?? null,
      status: 'upcoming',
    });

  if (insertErr) {
    console.error('[events/new] insert failed:', insertErr);
    return { error: 'Could not create event. Try again.' };
  }

  redirect('/hush/app/dashboard');
}
