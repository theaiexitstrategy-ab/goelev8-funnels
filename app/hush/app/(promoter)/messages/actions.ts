'use server';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function ownerCheck(keywordId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hush/app/signin');

  const { data: promoter } = await supabase
    .from('hush_promoters')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!promoter) redirect('/hush/app/onboarding/promoter');

  const { data: keyword } = await supabase
    .from('hush_keywords')
    .select('promoter_id, is_active')
    .eq('id', keywordId)
    .maybeSingle();
  if (!keyword || keyword.promoter_id !== promoter.id) {
    return { error: 'Keyword not found.' };
  }

  return { supabase, currentlyActive: keyword.is_active };
}

type ActionResult = { error?: string };

export async function toggleKeywordActive(keywordId: string): Promise<ActionResult> {
  const check = await ownerCheck(keywordId);
  if ('error' in check) return check;

  const { error } = await check.supabase
    .from('hush_keywords')
    .update({ is_active: !check.currentlyActive })
    .eq('id', keywordId);

  if (error) {
    console.error('[messages/toggle] update failed:', error);
    return { error: 'Could not update keyword. Try again.' };
  }

  revalidatePath('/hush/app/messages');
  return {};
}

export async function deleteKeyword(keywordId: string): Promise<ActionResult> {
  const check = await ownerCheck(keywordId);
  if ('error' in check) return check;

  const { error } = await check.supabase
    .from('hush_keywords')
    .delete()
    .eq('id', keywordId);

  if (error) {
    console.error('[messages/delete] delete failed:', error);
    return { error: 'Could not delete keyword. Try again.' };
  }

  revalidatePath('/hush/app/messages');
  return {};
}
