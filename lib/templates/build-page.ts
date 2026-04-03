// lib/templates/build-page.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import fs from 'fs/promises';
import path from 'path';

interface FunnelData {
  business_name?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  phone?: string;
  twilio_number?: string;
  location?: string;
  offer?: string;
  accent_color?: string;
  slug: string;
  template_key: string;
  trust_bullet_1?: string;
  trust_bullet_2?: string;
  trust_bullet_3?: string;
}

export async function buildFunnelPage(data: FunnelData): Promise<string> {
  const key = /^[a-z]+$/.test(data.template_key) ? data.template_key : 'fitness';
  const templatePath = path.join(process.cwd(), 'templates', `${key}.html`);

  let html: string;
  try {
    html = await fs.readFile(templatePath, 'utf-8');
  } catch {
    // Fallback to fitness template
    html = await fs.readFile(path.join(process.cwd(), 'templates', 'fitness.html'), 'utf-8');
  }

  const year = new Date().getFullYear().toString();
  const bookingUrl = `https://goelev8.ai/f/${data.slug}/book`;

  const tokens: Record<string, string> = {
    '{{BUSINESS_NAME}}':  s(data.business_name),
    '{{HEADLINE}}':       s(data.headline),
    '{{SUBHEADLINE}}':    s(data.subheadline),
    '{{CTA_TEXT}}':       s(data.cta_text) || 'Get Started Free',
    '{{PHONE}}':          s(data.phone || data.twilio_number),
    '{{LOCATION}}':       s(data.location),
    '{{OFFER}}':          s(data.offer),
    '{{ACCENT_COLOR}}':   /^#[0-9A-Fa-f]{6}$/.test(data.accent_color || '')
                            ? data.accent_color! : '#00CFFF',
    '{{SLUG}}':           data.slug.replace(/[^a-z0-9-]/g, ''),
    '{{TWILIO_NUMBER}}':  s(data.twilio_number || data.phone),
    '{{TRUST_BULLET_1}}': s(data.trust_bullet_1),
    '{{TRUST_BULLET_2}}': s(data.trust_bullet_2),
    '{{TRUST_BULLET_3}}': s(data.trust_bullet_3),
    '{{BOOKING_URL}}':    bookingUrl,
    '{{YEAR}}':           year,
  };

  // Replace all tokens
  for (const [token, value] of Object.entries(tokens)) {
    html = html.replaceAll(token, value);
  }

  // Safety: strip any unreplaced tokens
  html = html.replace(/\{\{[A-Z_0-9]+\}\}/g, '');

  return html;
}

// Sanitize + hard limit each token value
function s(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, 500);
}
