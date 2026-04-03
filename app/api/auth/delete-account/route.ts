// app/api/auth/delete-account/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { authArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServiceClient } from '@/lib/db/supabase-service';
import { createServerClient } from '@/lib/db/supabase-server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(authArcjet, req);
    if (limited) return limited;
    validateCSRF(req);

    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const service = createServiceClient();

    // Load user for Stripe customer ID
    const { data: user } = await service.from('users').select('*').eq('id', userId).single();

    // Delete in FK-safe order
    const tables = [
      'sms_log','bookings','product_sales','leads','chat_sessions',
      'funnel_analytics','sms_blasts','sms_credits_log','products',
      'store_integrations','booked_slots','availability',
      'calendar_integrations','funnels','users',
    ];
    for (const table of tables) {
      const col = table === 'product_sales' ? 'seller_user_id' : 'user_id';
      await service.from(table).delete().eq(col, userId);
    }

    // Cancel Stripe subscription
    if (user?.stripe_customer_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const subs = await stripe.subscriptions.list({ customer: user.stripe_customer_id });
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // Delete Supabase auth user
    await service.auth.admin.deleteUser(userId);

    return Response.json({ success: true });
  } catch (err) {
    console.error('[delete-account]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
