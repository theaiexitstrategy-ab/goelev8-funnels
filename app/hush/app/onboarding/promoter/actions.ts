'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const PromoterSchema = z.object({
  brand_name: z.string().trim().min(2, 'Brand name must be at least 2 characters').max(60),
  keyword_prefix: z
    .string()
    .trim()
    .min(3, 'Keyword prefix must be at least 3 characters')
    .max(20, 'Keep it short — 20 characters max')
    .regex(/^[A-Z0-9]+$/, 'Letters and numbers only, no spaces'),
  plan: z.enum(['hustle', 'pro', 'mogul']),
});

export async function savePromoterProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const parsed = PromoterSchema.safeParse({
    brand_name: formData.get('brand_name')?.toString() ?? '',
    keyword_prefix: (formData.get('keyword_prefix')?.toString() ?? '').toUpperCase(),
    plan: formData.get('plan')?.toString() ?? 'hustle',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Stamp tier on the user row (drives credit allowance + UI gating).
  const { error: tierErr } = await supabase
    .from('hush_users')
    .update({ tier: parsed.data.plan })
    .eq('id', user.id);
  if (tierErr) {
    console.error('[onboarding/promoter] tier update failed:', tierErr);
    return { error: 'Could not save plan. Try again.' };
  }

  const { error: promoterErr } = await supabase
    .from('hush_promoters')
    .upsert(
      {
        user_id: user.id,
        brand_name: parsed.data.brand_name,
        keyword_prefix: parsed.data.keyword_prefix,
        subscription_status: 'trialing',
      },
      { onConflict: 'user_id' }
    );
  if (promoterErr) {
    if (promoterErr.code === '23505') {
      // unique violation — keyword_prefix already taken
      return { error: 'That keyword prefix is taken. Pick another.' };
    }
    console.error('[onboarding/promoter] promoter upsert failed:', promoterErr);
    return { error: 'Could not save brand. Try again.' };
  }

  // Stripe subscription wiring lands in the next phase. For now we land
  // promoters in the dashboard with subscription_status='trialing'.
  redirect('/hush/app/dashboard');
}
