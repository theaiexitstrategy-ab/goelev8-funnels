// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const claimSchema = z.object({
  funnel_id: z.string().uuid(),
  slug: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { funnel_id, slug } = parsed.data;

    // Get the authenticated user
    const supabaseAuth = createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service client to update the funnel
    const service = createServiceClient();

    // Only claim if unclaimed and matching slug
    const { data: funnel, error: fetchError } = await service
      .from('funnels')
      .select('id, is_claimed')
      .eq('id', funnel_id)
      .eq('slug', slug)
      .single();

    if (fetchError || !funnel) {
      return Response.json({ error: 'Funnel not found' }, { status: 404 });
    }

    if (funnel.is_claimed) {
      return Response.json({ error: 'This page has already been claimed' }, { status: 409 });
    }

    // Claim the funnel
    const { error: updateError } = await service
      .from('funnels')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        user_id: user.id,
        expires_at: null, // permanent now
      })
      .eq('id', funnel_id)
      .eq('is_claimed', false);

    if (updateError) {
      console.error('[build/claim] Update error:', updateError);
      return Response.json({ error: 'Failed to claim funnel' }, { status: 500 });
    }

    return Response.json({ success: true, slug });

  } catch (err) {
    console.error('[build/claim]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
