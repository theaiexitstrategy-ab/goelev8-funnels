'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const NewKeywordSchema = z.object({
  event_id: z.string().uuid('Pick an event'),
  keyword: z
    .string()
    .trim()
    .min(2, 'Keyword must be at least 2 characters')
    .max(20, 'Keep it short — 20 characters max')
    .regex(/^[A-Z0-9]+$/, 'Letters and numbers only, no spaces'),
  tier: z.enum(['vip', 'general', 'new']),
  price: z.coerce.number().min(0, 'Price must be 0 or higher').max(10000),
  booking_url: z.string().trim().url('Booking link must be a full URL'),
  ai_reply: z
    .string()
    .trim()
    .min(10, 'Reply must be at least 10 characters')
    .max(320, 'Reply must be 320 characters or fewer (one SMS-ish)'),
});

export async function createKeyword(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const parsed = NewKeywordSchema.safeParse({
    event_id: formData.get('event_id')?.toString() ?? '',
    keyword: (formData.get('keyword')?.toString() ?? '').toUpperCase(),
    tier: formData.get('tier')?.toString() ?? 'general',
    price: formData.get('price')?.toString() ?? '0',
    booking_url: formData.get('booking_url')?.toString() ?? '',
    ai_reply: formData.get('ai_reply')?.toString() ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Verify the event belongs to this promoter — defense in depth on top of RLS.
  const { data: evt } = await supabase
    .from('hush_events')
    .select('id, promoter_id')
    .eq('id', parsed.data.event_id)
    .maybeSingle();
  if (!evt || evt.promoter_id !== promoter.id) {
    return { error: 'Event not found.' };
  }

  const { error: insertErr } = await supabase
    .from('hush_keywords')
    .insert({
      event_id: parsed.data.event_id,
      promoter_id: promoter.id,
      keyword: parsed.data.keyword,
      tier: parsed.data.tier,
      price: parsed.data.price,
      booking_url: parsed.data.booking_url,
      ai_reply: parsed.data.ai_reply,
      is_active: true,
    });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { error: 'That keyword is already taken. Pick another.' };
    }
    console.error('[messages/new-keyword] insert failed:', insertErr);
    return { error: 'Could not save keyword. Try again.' };
  }

  revalidatePath('/hush/app/messages');
  redirect('/hush/app/messages?tab=keywords');
}
