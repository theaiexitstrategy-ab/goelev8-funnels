// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/provisioning/run
//
// The actual provisioning worker. Walks every step from the spec, logging
// each result so Vercel captures the full trace. On individual step failure
// we log + Twilio-notify Aaron but continue with remaining steps so a single
// hiccup doesn't leave a partially-provisioned client stuck halfway.

import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { getConfig, getFlags } from '@/lib/onboarding-configs';
import { notifyAdminEmail, notifyAdminSMS, esc } from '@/lib/onboarding-runtime';

type StepResult = { name: string; ok: boolean; note?: string };

export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-internal-key') ?? '';
  const expected = process.env.INTERNAL_API_KEY ?? '';
  if (!expected || provided !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { client_id?: string; slug?: string; config_slug?: string }
    | null;
  if (!body?.client_id) {
    return Response.json({ error: 'client_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const log: StepResult[] = [];

  const recordStep = async (name: string, fn: () => Promise<string | void>) => {
    try {
      const note = await fn();
      console.log(`[provisioning] ✓ ${name}${note ? ` — ${note}` : ''}`);
      log.push({ name, ok: true, note: typeof note === 'string' ? note : undefined });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error(`[provisioning] ✗ ${name}:`, msg);
      log.push({ name, ok: false, note: msg });
      await notifyAdminSMS(`⚠️ Provisioning step "${name}" failed for client ${body.client_id}: ${msg.slice(0, 100)}`);
    }
  };

  // ── Load source rows ──
  let client: any = null;
  let clientInfo: any = null;
  let tenant: any = null;
  let stagedBlob: Record<string, any> = {};

  await recordStep('load source rows', async () => {
    const { data: c, error: cErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', body.client_id)
      .single();
    if (cErr || !c) throw cErr ?? new Error('client not found');
    client = c;

    const { data: ci } = await supabase
      .from('client_info')
      .select('*')
      .eq('client_id', body.client_id)
      .maybeSingle();
    clientInfo = ci;
    stagedBlob = extractStaged(ci?.brand_notes ?? '');

    const { data: t } = await supabase
      .from('tenants')
      .select('*')
      .eq('client_id', body.client_id)
      .maybeSingle();
    tenant = t;
    return `client=${c.slug}`;
  });

  if (!client) {
    return Response.json({ ok: false, log }, { status: 500 });
  }

  const cfg = getConfig(client.onboarding_config_slug ?? body.config_slug ?? '');
  if (!cfg) {
    log.push({ name: 'config lookup', ok: false, note: 'unknown config_slug' });
    return Response.json({ ok: false, log }, { status: 500 });
  }
  const flags = getFlags(cfg);

  // ── Step: mark status = provisioning ──
  await recordStep('flip status → provisioning', async () => {
    await supabase
      .from('clients')
      .update({ onboarding_status: 'provisioning' })
      .eq('id', client.id);
  });

  // ── Step: ensure tenants row exists + fully populated ──
  await recordStep('upsert tenants row', async () => {
    const services =
      tenant?.services && Array.isArray(tenant.services) && tenant.services.length
        ? tenant.services
        : clientInfo?.services ?? [];
    const availability = tenant?.availability ?? {};
    const tenantPatch = {
      client_id:          client.id,
      slug:               client.slug,
      business_name:      tenant?.business_name || client.business_name || cfg.businessName,
      owner_email:        tenant?.owner_email || client.email || '',
      owner_phone:        tenant?.owner_phone || '',
      brand_color:        tenant?.brand_color || client.brand_color || cfg.accentColor,
      logo_url:           tenant?.logo_url || '',
      services,
      availability,
      plan:               client.plan || cfg.plan,
      stripe_customer_id: client.stripe_customer_id || '',
      portal_url:         `https://portal.goelev8.ai/${client.slug}`,
      booking_url:        `https://book.goelev8.ai/${client.slug}`,
    };
    if (tenant) {
      await supabase.from('tenants').update(tenantPatch).eq('id', tenant.id);
    } else {
      await supabase.from('tenants').insert(tenantPatch);
    }
    return `tenant=${client.slug}`;
  });

  // ── Step: ensure client_info row is fully written ──
  await recordStep('upsert client_info row', async () => {
    const businessBasics = stagedBlob.business_basics ?? {};
    const socialProof = stagedBlob.social_proof ?? {};
    const patch: Record<string, any> = {
      client_id: client.id,
      business_name: clientInfo?.business_name || client.business_name || cfg.businessName,
    };
    if (businessBasics.service_area && !clientInfo?.address) patch.address = String(businessBasics.service_area);
    // We intentionally don't overwrite existing brand_notes — that's where
    // our staged JSON blob lives. Provisioning preserves it as the audit
    // trail of what was collected during onboarding.
    if (clientInfo) {
      await supabase.from('client_info').update(patch).eq('id', clientInfo.id);
    } else {
      await supabase.from('client_info').insert(patch);
    }
    void socialProof; // captured in brand_notes blob — no separate column
  });

  // ── Step: ensure client_settings row exists ──
  await recordStep('upsert client_settings row', async () => {
    const { data: existing } = await supabase
      .from('client_settings')
      .select('id')
      .eq('client_id', client.slug)
      .maybeSingle();
    const patch: Record<string, any> = {
      client_id: client.slug,
      studio_name: cfg.businessName,
      owner_name: cfg.ownerName || client.name || '',
      owner_email: client.email || '',
      owner_phone: tenant?.owner_phone || '',
    };
    if (existing) {
      await supabase.from('client_settings').update(patch).eq('id', existing.id);
    } else {
      await supabase.from('client_settings').insert(patch);
    }
  });

  // ── Step: verify sms_credits ──
  await recordStep('verify sms_credits', async () => {
    const initial = cfg.smsCreditsIncluded ?? 500;
    const { data: existing } = await supabase
      .from('sms_credits')
      .select('client_id, balance')
      .eq('client_id', client.slug)
      .maybeSingle();
    if (!existing) {
      await supabase.from('sms_credits').insert({ client_id: client.slug, balance: initial });
      return `seeded ${initial}`;
    }
    if ((existing.balance ?? 0) <= 0) {
      await supabase
        .from('sms_credits')
        .update({ balance: initial })
        .eq('client_id', client.slug);
      return `refilled to ${initial}`;
    }
    return `already at ${existing.balance}`;
  });

  // ── Step: set portal_tabs based on tier + flags ──
  await recordStep('set portal_tabs', async () => {
    const tabs: string[] = ['Dashboard', 'Leads', 'SMS', 'Settings'];
    if (flags.has_lead_agent || flags.has_voice_agent) tabs.push('Bookings');
    if (flags.has_voice_agent) tabs.push('Voice');
    await supabase
      .from('clients')
      .update({ portal_tabs: tabs })
      .eq('id', client.id);
    return tabs.join(', ');
  });

  // ── Step: mark status complete ──
  await recordStep('flip status → provisioning_complete', async () => {
    await supabase
      .from('clients')
      .update({ onboarding_status: 'provisioning_complete' })
      .eq('id', client.id);
  });

  // ── Step: notify Aaron ──
  await recordStep('notify admin (SMS + email)', async () => {
    const smsMsg = `⚙️ ${cfg.businessName} provisioned. Tenant created at portal.goelev8.ai/${client.slug}. Ready for your review.`;
    await notifyAdminSMS(smsMsg);
    await notifyAdminEmail({
      subject: `Provisioned: ${cfg.businessName}`,
      htmlBody: buildProvisionEmail({
        cfg,
        clientId: client.id,
        slug: client.slug,
        log,
        flags,
        stagedBlob,
      }),
    });
  });

  return Response.json({ ok: true, log });
}

const STAGED_TAG = '[GOELEV8_STAGED]:';
function extractStaged(brandNotes: string): Record<string, any> {
  if (!brandNotes?.startsWith(STAGED_TAG)) return {};
  try {
    return JSON.parse(brandNotes.slice(STAGED_TAG.length));
  } catch {
    return {};
  }
}

function buildProvisionEmail(args: {
  cfg: ReturnType<typeof getConfig>;
  clientId: string;
  slug: string;
  log: StepResult[];
  flags: ReturnType<typeof getFlags>;
  stagedBlob: Record<string, any>;
}): string {
  const cfg = args.cfg!;
  const logHtml = args.log
    .map(
      (s) =>
        `<li style="color:${s.ok ? '#9eef9e' : '#f59e9e'};font-size:13px;padding:3px 0;">${s.ok ? '✓' : '✗'} ${esc(s.name)}${s.note ? ` <span style="color:#888;">— ${esc(s.note)}</span>` : ''}</li>`,
    )
    .join('');
  const checklist = `
  <ul style="padding-left:18px;margin:0 0 18px;color:#cccccc;font-size:13px;line-height:1.7;">
    ${args.flags.has_voice_agent ? '<li>Assign Twilio number → <code style="background:#1a1a1a;padding:2px 6px;border-radius:3px;">clients.twilio_phone_number</code></li>' : ''}
    ${args.flags.has_voice_agent ? '<li>Create Vapi assistant + paste ID into <code style="background:#1a1a1a;padding:2px 6px;border-radius:3px;">clients.vapi_assistant_id</code></li>' : ''}
    <li>Verify portal tabs render correctly at portal.goelev8.ai/${esc(args.slug)}</li>
    <li>Send welcome SMS to client</li>
    <li>Flip <code style="background:#1a1a1a;padding:2px 6px;border-radius:3px;">clients.onboarding_status = 'live'</code> when ready</li>
  </ul>`;
  return `<!doctype html><html><body style="margin:0;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 6px;letter-spacing:3px;text-transform:uppercase;font-size:11px;color:#F5B800;">Provisioning complete</p>
    <h1 style="margin:0 0 18px;font-size:24px;font-weight:300;">${esc(cfg.businessName)}</h1>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:6px;margin-bottom:18px;">
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Client ID</td><td style="padding:10px 14px;color:#fff;font-size:12px;border-bottom:1px solid #1a1a1a;font-family:monospace;">${esc(args.clientId)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Slug</td><td style="padding:10px 14px;color:#fff;font-size:13px;border-bottom:1px solid #1a1a1a;">${esc(args.slug)}</td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;">Portal</td><td style="padding:10px 14px;color:#9bc;font-size:13px;border-bottom:1px solid #1a1a1a;"><a href="https://portal.goelev8.ai/${esc(args.slug)}" style="color:#9bc;">portal.goelev8.ai/${esc(args.slug)}</a></td></tr>
      <tr><td style="padding:10px 14px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Flags</td><td style="padding:10px 14px;color:#fff;font-size:13px;">lead:${args.flags.has_lead_agent} · voice:${args.flags.has_voice_agent} · site:${args.flags.has_site_build} · jobber:${args.flags.jobber_integration}</td></tr>
    </table>

    <p style="margin:18px 0 8px;font-size:14px;color:#fff;">Run log</p>
    <ul style="padding-left:18px;margin:0 0 18px;">${logHtml}</ul>

    <p style="margin:18px 0 8px;font-size:14px;color:#fff;">Manual steps remaining</p>
    ${checklist}

    <details style="margin-top:18px;">
      <summary style="color:#888;font-size:12px;cursor:pointer;">Onboarding answers (raw)</summary>
      <pre style="background:#0a0a0a;border:1px solid #1a1a1a;padding:12px;border-radius:6px;color:#ccc;font-size:11px;white-space:pre-wrap;word-break:break-word;">${esc(JSON.stringify(args.stagedBlob, null, 2))}</pre>
    </details>

    <p style="margin:24px 0 0;color:#666;font-size:11px;border-top:1px solid #1a1a1a;padding-top:14px;">GoElev8.ai · automated provisioning · ${esc(new Date().toISOString())}</p>
  </div>
</body></html>`;
}
