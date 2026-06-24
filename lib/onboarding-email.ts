// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Resend-powered transactional emails for the onboarding flow.
// Phase 1 ships one email: the receipt sent immediately after Stripe
// confirms payment. Phase 2 will add the admin notification + magic
// resume link emails.

import { Resend } from 'resend';
import type { OnboardingConfig } from './onboarding-configs';

const FROM = 'GoElev8.ai <noreply@goelev8.ai>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.goelev8.ai';

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[onboarding-email] RESEND_API_KEY not configured — skipping email send');
    return null;
  }
  return new Resend(key);
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export type ReceiptEmailParams = {
  to: string;
  customerName: string | null;
  cfg: OnboardingConfig;
  resumeToken: string;
};

function receiptHtml({ customerName, cfg, resumeToken }: ReceiptEmailParams): string {
  const accent = cfg.accentColor;
  const setupLine = dollars(cfg.setupFeeCents);
  const monthlyLine = dollars(cfg.monthlyPriceCents);
  const featureItems = cfg.features
    .map((f) => `<li style="padding:4px 0;color:#cccccc;">${escape(f)}</li>`)
    .join('');
  const ctaUrl = `${APP_URL}/onboard/resume/${encodeURIComponent(resumeToken)}`;

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#000;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:36px;">
        <tr><td>
          <p style="margin:0 0 24px;letter-spacing:4px;text-transform:uppercase;font-size:12px;color:${accent};">
            <span style="color:${accent};font-weight:bold;">GO</span><span style="color:#ffffff;font-weight:200;">ELEV8.AI</span>
          </p>
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:300;color:#ffffff;">
            Welcome${customerName ? `, ${escape(customerName)}` : ''} — your setup is confirmed.
          </h1>
          <p style="margin:0 0 28px;color:#a8a8a8;font-size:14px;line-height:1.6;">
            Thanks for trusting us with ${escape(cfg.businessName)}. Your build kicks off now.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border:1px solid #1f1f1f;border-radius:6px;margin:0 0 28px;">
            <tr><td style="padding:14px 18px;border-bottom:1px solid #1a1a1a;color:#cccccc;font-size:14px;">Setup Fee (one-time)</td><td style="padding:14px 18px;border-bottom:1px solid #1a1a1a;color:#ffffff;font-size:14px;text-align:right;">${setupLine}</td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #1a1a1a;color:#cccccc;font-size:14px;">Monthly Plan (GoElev8.ai)</td><td style="padding:14px 18px;border-bottom:1px solid #1a1a1a;color:#ffffff;font-size:14px;text-align:right;">${monthlyLine}/mo</td></tr>
            <tr><td style="padding:14px 18px;color:${accent};font-size:14px;text-transform:uppercase;letter-spacing:2px;">Total charged today</td><td style="padding:14px 18px;color:${accent};font-size:18px;text-align:right;font-weight:600;">${setupLine}</td></tr>
          </table>

          <p style="margin:0 0 10px;color:#ffffff;font-size:14px;font-weight:600;">What's included</p>
          <ul style="margin:0 0 28px;padding:0 0 0 18px;color:#cccccc;font-size:14px;line-height:1.55;">
            ${featureItems}
          </ul>

          <p style="margin:24px 0 12px;color:#ffffff;font-size:16px;">Your onboarding starts now.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td bgcolor="${accent}" style="border-radius:4px;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;text-decoration:none;color:#000000;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
                Start Your Onboarding →
              </a>
            </td></tr>
          </table>

          <p style="margin:28px 0 0;color:#666666;font-size:12px;line-height:1.6;border-top:1px solid #1a1a1a;padding-top:18px;">
            GoElev8.ai &middot; <a href="mailto:ab@goelev8.ai" style="color:#999999;">ab@goelev8.ai</a> &middot; <a href="https://goelev8.ai" style="color:#999999;">goelev8.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

export async function sendReceiptEmail(params: ReceiptEmailParams): Promise<{ id?: string; error?: string }> {
  const r = client();
  if (!r) return { error: 'Resend not configured' };
  try {
    const { data, error } = await r.emails.send({
      from: FROM,
      to: params.to,
      subject: "You're in — here's your GoElev8.ai receipt 🎉",
      html: receiptHtml(params),
    });
    if (error) return { error: error.message ?? String(error) };
    return { id: data?.id };
  } catch (err: any) {
    return { error: err?.message ?? 'send failed' };
  }
}
