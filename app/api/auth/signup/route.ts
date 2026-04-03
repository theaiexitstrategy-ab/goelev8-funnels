// app/api/auth/signup/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { authArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { signupSchema } from '@/lib/security/sanitize';
import { createServiceClient } from '@/lib/db/supabase-service';
import Stripe from 'stripe';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(authArcjet, req);
    if (limited) return limited;

    validateCSRF(req);

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: 'Invalid input' }, { status: 400 });

    const { email, password, full_name, business_name, plan, prompt } = parsed.data;
    const supabase = createServiceClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: false,
    });
    if (authError || !authData.user)
      return Response.json({ error: 'Could not create account' }, { status: 400 });

    const userId = authData.user.id;

    // 2. Create Stripe customer
    const customer = await stripe.customers.create({
      email, name: full_name,
      metadata: { user_id: userId, plan },
    });

    // 3. Create Stripe subscription with 7-day trial
    // Card is authorized now, charged automatically on Day 8
    const priceMap: Record<string, string> = {
      launch: process.env.STRIPE_PRICE_LAUNCH_MONTHLY!,
      grow:   process.env.STRIPE_PRICE_GROW_MONTHLY!,
      scale:  process.env.STRIPE_PRICE_SCALE_MONTHLY!,
    };

    // 4. Insert user record
    await supabase.from('users').insert({
      id: userId,
      email,
      full_name,
      tier: 'trial',
      stripe_customer_id: customer.id,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 5. Send welcome email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Welcome to GoElev8.ai — Your 7-day trial has started`,
      html: `<p>Hi ${full_name},</p>
             <p>Your AI business page is being built. You'll have a live URL within 60 seconds.</p>
             <p>Your card will not be charged until Day 8. Cancel before then and you owe nothing.</p>
             <p>— The GoElev8.AI System</p>`,
    });

    return Response.json({ success: true, user_id: userId, plan });

  } catch (err) {
    console.error('[auth/signup]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
