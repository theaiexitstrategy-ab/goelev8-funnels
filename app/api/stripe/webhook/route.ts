// app/api/stripe/webhook/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { verifyStripeWebhook } from '@/lib/security/webhooks';
import { createServiceClient } from '@/lib/db/supabase-service';
import { getPlanFromPriceId } from '@/lib/tiers';
import { Resend } from 'resend';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = verifyStripeWebhook(payload, sig);
  } catch {
    return new Response('Webhook signature invalid', { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        // SMS credits purchase
        if (session.metadata?.sms_credits) {
          const credits = parseInt(session.metadata.sms_credits);
          const amount = parseFloat(session.metadata.amount_usd!);
          await supabase.rpc('add_sms_credits', { p_user_id: userId, p_credits: credits });
          await supabase.from('sms_credits_log').insert({
            user_id: userId,
            credits_added: credits,
            amount_usd: amount,
            rate_per_credit: amount / credits,
            stripe_payment_intent_id: session.payment_intent as string,
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id;
        const tier = getPlanFromPriceId(priceId);

        await supabase.from('users').update({
          tier,
          subscribed_at: new Date(sub.start_date * 1000).toISOString(),
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString() : null,
        }).eq('id', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase.from('users').update({
          tier: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }).eq('id', userId);

        // Pause all active SMS sequences
        await supabase.from('leads')
          .update({ next_sms_at: null, status: 'dead' })
          .eq('user_id', userId)
          .eq('status', 'sms_sequence');
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) break;

        // Count leads captured during trial
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: `Your GoElev8.ai trial ends tomorrow — ${count || 0} leads captured`,
          html: `<p>Hi ${user.full_name},</p>
                 <p>Your 7-day free trial ends tomorrow. You've captured <strong>${count || 0} leads</strong> so far.</p>
                 <p>Your card will be charged automatically tomorrow. If you want to cancel, do it before midnight tonight.</p>
                 <p>— The GoElev8.AI System</p>`,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { data: user } = await supabase
          .from('users').select('*').eq('stripe_customer_id', customerId).single();
        if (!user) break;

        // Downgrade to read-only (keep data, stop lead capture)
        await supabase.from('users').update({ tier: 'cancelled' }).eq('id', user.id);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: 'GoElev8.ai — Payment failed. Update your card to restore access.',
          html: `<p>Hi ${user.full_name},</p>
                 <p>We couldn't charge your card. Your account is now in read-only mode.</p>
                 <p>Update your payment method to restore full access.</p>
                 <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/settings/billing">Update payment method →</a></p>`,
        });
        break;
      }
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error('[stripe/webhook]', err);
    return Response.json({ error: 'Handler error' }, { status: 500 });
  }
}
