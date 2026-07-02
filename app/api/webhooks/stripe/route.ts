// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// CANONICAL Stripe webhook for the unified GoElev8.ai client pipeline.
//
//   URL:    https://www.goelev8.ai/api/webhooks/stripe
//   Events: checkout.session.completed
//
// Required Stripe Checkout metadata when creating a session:
//   { slug, config_slug, owner_phone? }
//     - slug:        unique slug for THIS client (e.g. "roqbody"); becomes clients.slug
//     - config_slug: which onboarding-configs.ts entry to load (often same as slug)
//     - owner_phone: optional, stored on tenants.owner_phone if present
//
// On checkout.session.completed:
//   1. Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
//   2. Idempotency: skip if we've already processed this session_id
//   3. Upsert clients row (insert if missing, otherwise update)
//   4. Initialize sms_credits + credit_ledger signup bonus
//   5. SMS Aaron a "new client paid" notification
//   6. Email Aaron the same notification
//   7. Always return 200 — never bounce Stripe with a 5xx; failures are logged

import Stripe from 'stripe';
import { createServiceClient } from '@/lib/db/supabase-service';
import { getConfig, getFlags } from '@/lib/onboarding-configs';
import { getPack, totalCreditsForPack } from '@/lib/sms-packs';
import {
  ensureInitialSmsCredits,
  notifyAdminEmail,
  notifyAdminSMS,
  esc,
} from '@/lib/onboarding-runtime';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET not configured');
    return Response.json({ received: true }); // log + 200 so Stripe doesn't keep retrying
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[webhooks/stripe] signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
  } catch (err: any) {
    // Per spec: never bubble errors to Stripe. Log + 200.
    console.error('[webhooks/stripe] handler threw:', err?.message ?? err);
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(sessionLite: Stripe.Checkout.Session) {
  const md = sessionLite.metadata ?? {};

  // Branch by purchase type. SMS pack purchases go through their own path;
  // McClain intake tier signups go through theirs; anything else falls back
  // to the client-signup flow (new client paying the setup fee on /qsetup,
  // /affsetup, /onboard etc.).
  if (md.type === 'sms_pack') {
    await handleSmsPackPurchase(sessionLite);
    return;
  }
  if (md.source === 'mcclain') {
    await handleMcclainCheckout(sessionLite);
    return;
  }

  const configSlug =
    md.config_slug ?? md.onboarding_slug ?? md.client ?? null;
  const requestedSlug = md.slug ?? md.client ?? configSlug ?? null;
  const ownerPhoneRaw = md.owner_phone ?? null;

  if (!configSlug) {
    console.log('[webhooks/stripe] no config_slug in metadata — ignoring session', sessionLite.id);
    return;
  }
  const cfg = getConfig(configSlug);
  if (!cfg) {
    console.error('[webhooks/stripe] unknown config_slug:', configSlug);
    return;
  }
  const flags = getFlags(cfg);
  const supabase = createServiceClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from('clients')
    .select('id, slug, resume_token, email, business_name')
    .eq('stripe_checkout_session_id', sessionLite.id)
    .maybeSingle();
  if (existing) {
    console.log('[webhooks/stripe] session already processed:', sessionLite.id);
    return;
  }

  // Expand session for full customer + subscription data
  const session = await stripe.checkout.sessions.retrieve(sessionLite.id, {
    expand: ['customer', 'subscription', 'customer_details'],
  });

  const customer = session.customer && typeof session.customer !== 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : customer?.id ?? null;

  const email =
    session.customer_details?.email ??
    (customer && 'email' in customer ? (customer as any).email : null) ??
    null;
  const name =
    session.customer_details?.name ??
    (customer && 'name' in customer ? (customer as any).name : null) ??
    null;

  // Unique slug per row — guards against double-buys for same config.
  const baseSlug = requestedSlug ?? cfg.slug;
  const uniqueSlug = `${baseSlug}-${sessionLite.id.slice(-8)}`;

  const insertRow: Record<string, unknown> = {
    slug:                       uniqueSlug,
    name:                       name ?? cfg.clientName ?? cfg.ownerName ?? '',
    business_name:              cfg.businessName,
    email:                      email ?? '',
    brand_color:                cfg.accentColor,
    plan:                       cfg.plan,
    tier:                       cfg.tier ?? cfg.plan,
    stripe_customer_id:         customerId ?? '',
    stripe_subscription_id:     subscriptionId ?? '',
    stripe_checkout_session_id: sessionLite.id,
    paid_at:                    new Date().toISOString(),
    onboarding_status:          'onboarding',
    onboarding_step:            1,
    onboarding_config_slug:     cfg.slug,
    platform_fee_pct:           cfg.platformFeePct ?? 0,
  };

  const { data: inserted, error: insErr } = await supabase
    .from('clients')
    .insert(insertRow)
    .select('id, slug, resume_token')
    .single();

  if (insErr || !inserted) {
    console.error('[webhooks/stripe] clients insert failed:', insErr?.message);
    return;
  }

  console.log('[webhooks/stripe] client created:', inserted.id, 'session=', sessionLite.id);

  // Seed sms_credits + credit_ledger
  const initialCredits = cfg.smsCreditsIncluded ?? 500;
  await ensureInitialSmsCredits(supabase, {
    clientId: inserted.id,
    clientSlug: inserted.slug,
    initialBalance: initialCredits,
    cfg,
  });

  // Seed a minimal tenants row so portal lookups work even before the full
  // conversational onboarding completes. Provisioning later fills in services
  // / availability / etc. once we have them from the chat.
  if (ownerPhoneRaw) {
    await supabase.from('tenants').upsert(
      {
        client_id: inserted.id,
        slug: inserted.slug,
        business_name: cfg.businessName,
        owner_email: email ?? '',
        owner_phone: ownerPhoneRaw,
        brand_color: cfg.accentColor,
        plan: cfg.plan,
        stripe_customer_id: customerId ?? '',
        portal_url: `https://portal.goelev8.ai/${inserted.slug}`,
        booking_url: `https://book.goelev8.ai/${inserted.slug}`,
      },
      { onConflict: 'client_id' },
    );
  }

  const amount = ((sessionLite.amount_total ?? cfg.setupFeeCents) / 100).toFixed(0);
  const sms = `🔥 New GoElev8.ai client paid! ${cfg.businessName} (${cfg.slug}) — $${amount} setup fee received. Onboarding started.`;
  await notifyAdminSMS(sms);

  const resumeUrl = `https://www.goelev8.ai/onboarding/${cfg.slug}?token=${inserted.resume_token}`;
  await notifyAdminEmail({
    subject: `New Client Payment — ${cfg.businessName}`,
    htmlBody: adminPaidEmailHtml({
      businessName: cfg.businessName,
      clientName: name ?? cfg.clientName ?? '',
      email: email ?? '(no email on session)',
      amount,
      configSlug: cfg.slug,
      uniqueSlug: inserted.slug,
      resumeUrl,
      flagsSummary: summarizeFlags(flags),
    }),
  });
}

// ── SMS PACK PURCHASE HANDLER ────────────────────────────────────────────

async function handleSmsPackPurchase(sessionLite: Stripe.Checkout.Session) {
  const md = sessionLite.metadata ?? {};
  const packId = md.pack_id ?? '';
  const pack = getPack(packId);
  if (!pack) {
    console.error('[webhooks/stripe:sms_pack] unknown pack_id:', packId);
    await notifyAdminSMS(`⚠️ SMS pack purchase failed — unknown pack_id "${packId}" on session ${sessionLite.id}`);
    return;
  }

  const supabase = createServiceClient();

  // Idempotency — credit_ledger.ref_id stores the session id so a Stripe
  // retry never double-credits.
  const { data: existingLedger } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('ref_id', sessionLite.id)
    .maybeSingle();
  if (existingLedger) {
    console.log('[webhooks/stripe:sms_pack] session already credited:', sessionLite.id);
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionLite.id, {
    expand: ['customer', 'customer_details'],
  });

  const email =
    session.customer_details?.email ??
    (session.customer && typeof session.customer !== 'string' && 'email' in session.customer
      ? (session.customer as any).email
      : null) ??
    null;
  const name = session.customer_details?.name ?? null;
  const totalCredits = totalCreditsForPack(pack);

  // Match to a clients row:
  //   1) explicit client_slug in metadata wins
  //   2) otherwise the most recent paid client with this email
  //   3) otherwise: notify Aaron, manual application
  let matchedClient: { id: string; slug: string; business_name: string | null } | null = null;
  const explicitSlug = md.client_slug?.trim();
  if (explicitSlug) {
    const { data } = await supabase
      .from('clients')
      .select('id, slug, business_name')
      .or(`slug.eq.${explicitSlug},onboarding_config_slug.eq.${explicitSlug}`)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    matchedClient = data ?? null;
  }
  if (!matchedClient && email) {
    const { data } = await supabase
      .from('clients')
      .select('id, slug, business_name')
      .eq('email', email)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    matchedClient = data ?? null;
  }

  if (matchedClient) {
    // Credit + ledger entry.
    const { data: smsRow } = await supabase
      .from('sms_credits')
      .select('client_id, balance')
      .eq('client_id', matchedClient.slug)
      .maybeSingle();
    const newBalance = (smsRow?.balance ?? 0) + totalCredits;
    if (smsRow) {
      await supabase
        .from('sms_credits')
        .update({ balance: newBalance })
        .eq('client_id', matchedClient.slug);
    } else {
      await supabase.from('sms_credits').insert({
        client_id: matchedClient.slug,
        balance: newBalance,
      });
    }
    await supabase.from('credit_ledger').insert({
      client_id: matchedClient.id,
      delta: totalCredits,
      reason: 'pack_purchase',
      ref_id: sessionLite.id,
      pack: pack.id,
      amount_cents: pack.priceCents,
    });
    console.log(
      `[webhooks/stripe:sms_pack] +${totalCredits} credits → ${matchedClient.slug} (new balance ${newBalance})`,
    );
    await notifyAdminSMS(
      `💰 SMS pack purchased: ${pack.name} ($${(pack.priceCents / 100).toFixed(0)}) — ${totalCredits} credits credited to ${matchedClient.business_name ?? matchedClient.slug}. New balance: ${newBalance}.`,
    );
    await notifyAdminEmail({
      subject: `SMS credits added: ${matchedClient.business_name ?? matchedClient.slug}`,
      htmlBody: smsPackEmail({
        title: 'Credits applied automatically',
        pack,
        totalCredits,
        email: email ?? '(no email)',
        name,
        clientSlug: matchedClient.slug,
        clientBusiness: matchedClient.business_name,
        newBalance,
        sessionId: sessionLite.id,
        appliedManually: false,
      }),
    });
    return;
  }

  // No match — ledger entry tagged unattributed, manual application required.
  console.warn('[webhooks/stripe:sms_pack] no client match for email:', email);
  await notifyAdminSMS(
    `⚠️ SMS pack purchased BUT no client match. ${pack.name} pack — ${totalCredits} credits — buyer: ${email ?? 'no email'}. Apply manually.`,
  );
  await notifyAdminEmail({
    subject: `SMS pack purchased — needs manual application (${email ?? 'no email'})`,
    htmlBody: smsPackEmail({
      title: 'Manual application required',
      pack,
      totalCredits,
      email: email ?? '(no email on session)',
      name,
      clientSlug: explicitSlug || '(not provided)',
      clientBusiness: null,
      newBalance: null,
      sessionId: sessionLite.id,
      appliedManually: true,
    }),
  });
}

// ── McCLAIN INTAKE TIER SIGNUP HANDLER ───────────────────────────────────
//
// Fires when a Checkout Session with metadata.source='mcclain' completes.
// This is the /mcclain/demo checkout flow (Base / Growth / Full Scale
// tiers), one-time setup + monthly subscription combined. We deliberately
// do NOT touch the multi-tenant provisioning pipeline — McClain Law is a
// standalone prospect, and any tenant setup will be handled manually by
// Aaron after signup. Just log + notify.

async function handleMcclainCheckout(sessionLite: Stripe.Checkout.Session) {
  const md = sessionLite.metadata ?? {};
  const tierKey = md.tier ?? 'unknown';
  const tierName = md.tier_name ?? tierKey;
  const monthlyCents = Number(md.monthly_cents ?? 0);
  const setupCents = Number(md.setup_cents ?? 0);

  // Pull the fully expanded session so we get email + name from Stripe.
  let email: string | null = null;
  let name: string | null = null;
  let subscriptionId: string | null = null;
  try {
    const full = await stripe.checkout.sessions.retrieve(sessionLite.id, {
      expand: ['customer_details', 'subscription'],
    });
    email = full.customer_details?.email ?? null;
    name = full.customer_details?.name ?? null;
    subscriptionId = typeof full.subscription === 'string'
      ? full.subscription
      : full.subscription?.id ?? null;
  } catch (err: any) {
    console.error('[webhooks/stripe:mcclain] session expand failed:', err?.message ?? err);
  }

  const monthlyDollars = (monthlyCents / 100).toFixed(0);
  const setupDollars = (setupCents / 100).toFixed(0);

  console.log(
    `[webhooks/stripe:mcclain] ✅ ${tierName} tier signup — ${name ?? '(no name)'} <${email ?? 'no email'}> — $${setupDollars} setup + $${monthlyDollars}/mo — session=${sessionLite.id} sub=${subscriptionId ?? '(none)'}`,
  );

  await notifyAdminSMS(
    `🎉 McClain Law signup! ${tierName} tier — ${name ?? email ?? 'buyer'} paid $${setupDollars} setup + $${monthlyDollars}/mo starting today.`,
  );

  await notifyAdminEmail({
    subject: `McClain Law signed up — ${tierName} tier`,
    htmlBody: mcclainSignupEmail({
      tierName,
      tierKey,
      monthlyDollars,
      setupDollars,
      email: email ?? '(no email on session)',
      name,
      subscriptionId,
      sessionId: sessionLite.id,
    }),
  });
}

function mcclainSignupEmail(args: {
  tierName: string;
  tierKey: string;
  monthlyDollars: string;
  setupDollars: string;
  email: string;
  name: string | null;
  subscriptionId: string | null;
  sessionId: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#0F1B2D;color:#FBFAF7;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 6px;letter-spacing:3px;text-transform:uppercase;font-size:11px;color:#E4C766;">McClain Law signup</p>
    <h1 style="margin:0 0 18px;font-size:24px;font-weight:300;">${esc(args.tierName)} tier — signed up</h1>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#16273F;border:1px solid #1e304a;border-radius:6px;">
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Buyer</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1e304a;">${esc(args.name) || '(no name)'}</td></tr>
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Email</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1e304a;">${esc(args.email)}</td></tr>
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Tier</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1e304a;">${esc(args.tierName)} (${esc(args.tierKey)})</td></tr>
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Charged today</td><td style="padding:10px 14px;color:#E4C766;font-size:14px;font-weight:700;border-bottom:1px solid #1e304a;">$${esc(args.setupDollars)} setup + $${esc(args.monthlyDollars)} first month</td></tr>
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Recurring</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1e304a;">$${esc(args.monthlyDollars)}/mo</td></tr>
      ${args.subscriptionId ? `<tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1e304a;">Subscription</td><td style="padding:10px 14px;color:#fff;font-size:12px;font-family:monospace;border-bottom:1px solid #1e304a;">${esc(args.subscriptionId)}</td></tr>` : ''}
      <tr><td style="padding:10px 14px;color:#8a94a6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</td><td style="padding:10px 14px;color:#fff;font-size:12px;font-family:monospace;">${esc(args.sessionId)}</td></tr>
    </table>
    <p style="margin:24px 0 8px;color:#fff;font-size:13px;">Next step: reach out within 1 business day to schedule the kick-off.</p>
    <p style="margin:18px 0 0;color:#8a94a6;font-size:11px;border-top:1px solid #1e304a;padding-top:14px;">GoElev8.ai · /mcclain/demo webhook · ${esc(new Date().toISOString())}</p>
  </div>
</body></html>`;
}

function smsPackEmail(args: {
  title: string;
  pack: ReturnType<typeof getPack>;
  totalCredits: number;
  email: string;
  name: string | null;
  clientSlug: string;
  clientBusiness: string | null;
  newBalance: number | null;
  sessionId: string;
  appliedManually: boolean;
}): string {
  const pack = args.pack!;
  return `<!doctype html><html><body style="margin:0;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 6px;letter-spacing:3px;text-transform:uppercase;font-size:11px;color:${args.appliedManually ? '#C8102E' : '#F5B800'};">${esc(args.title)}</p>
    <h1 style="margin:0 0 18px;font-size:24px;font-weight:300;">${esc(pack.name)} Pack — ${args.totalCredits.toLocaleString()} credits</h1>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;">
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Buyer email</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.email)}</td></tr>
      ${args.name ? `<tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Buyer name</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.name)}</td></tr>` : ''}
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Pack</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(pack.name)} ($${(pack.priceCents / 100).toFixed(0)})</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Credits</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${args.totalCredits.toLocaleString()}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Client slug</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.clientSlug)}</td></tr>
      ${args.clientBusiness ? `<tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Client</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.clientBusiness)}</td></tr>` : ''}
      ${args.newBalance !== null ? `<tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">New balance</td><td style="padding:10px 14px;color:#22c55e;font-size:13px;border-bottom:1px solid #1a1a1a;font-weight:700;">${args.newBalance.toLocaleString()} credits</td></tr>` : ''}
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</td><td style="padding:10px 14px;color:#fff;font-size:12px;font-family:monospace;">${esc(args.sessionId)}</td></tr>
    </table>
    ${args.appliedManually ? `<p style="margin:18px 0 0;color:#C8102E;font-size:13px;line-height:1.6;border-left:3px solid #C8102E;padding-left:12px;">⚠️ No client row matched this purchase. Manually find the right account and apply ${args.totalCredits.toLocaleString()} credits via Supabase, then add a credit_ledger entry referencing session ${esc(args.sessionId)}.</p>` : ''}
    <p style="margin:18px 0 0;color:#666;font-size:11px;border-top:1px solid #1a1a1a;padding-top:14px;">GoElev8.ai · /smscalc purchase webhook · ${esc(new Date().toISOString())}</p>
  </div>
</body></html>`;
}

function summarizeFlags(f: ReturnType<typeof getFlags>): string {
  const on: string[] = [];
  if (f.has_lead_agent) on.push('lead agent');
  if (f.has_voice_agent) on.push('voice agent');
  if (f.has_site_build) on.push('site build');
  if (f.jobber_integration) on.push('Jobber');
  return on.length ? on.join(' · ') : '(no flags enabled)';
}

function adminPaidEmailHtml(args: {
  businessName: string;
  clientName: string;
  email: string;
  amount: string;
  configSlug: string;
  uniqueSlug: string;
  resumeUrl: string;
  flagsSummary: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 6px;letter-spacing:3px;text-transform:uppercase;font-size:11px;color:#F5B800;">New Client Payment</p>
    <h1 style="margin:0 0 18px;font-size:24px;font-weight:300;">${esc(args.businessName)}</h1>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;">
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Buyer</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.clientName) || '(no name)'}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Email</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.email)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Amount</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">$${esc(args.amount)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Config</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.configSlug)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Client slug</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.uniqueSlug)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Flags</td><td style="padding:10px 14px;color:#fff;font-size:13px;">${esc(args.flagsSummary)}</td></tr>
    </table>
    <p style="margin:24px 0 8px;color:#fff;font-size:13px;">Onboarding resume link (copy to send to client):</p>
    <p style="margin:0 0 24px;color:#9bc;font-size:12px;word-break:break-all;"><a href="${esc(args.resumeUrl)}" style="color:#9bc;">${esc(args.resumeUrl)}</a></p>
    <p style="margin:18px 0 0;color:#666;font-size:11px;border-top:1px solid #1a1a1a;padding-top:14px;">GoElev8.ai · automated webhook · ${esc(new Date().toISOString())}</p>
  </div>
</body></html>`;
}
