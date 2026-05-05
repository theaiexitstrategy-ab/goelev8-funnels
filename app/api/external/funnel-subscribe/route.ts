// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Cross-origin subscribe endpoint for external sites (e.g. theaiexitstrategy.com).
// Auth is a per-funnel bearer token from funnel_api_keys — NOT the portal session
// or CSRF check, since the request originates from a different origin.

import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';
import { createHash } from 'crypto';

const strip = (v: string) => v.replace(/<[^>]*>/g, '').trim();

const subscribeSchema = z.object({
  email:        z.string().email().max(200).transform((s) => s.toLowerCase()),
  phone:        z.string().max(20).optional(),
  sms_opt_in:   z.boolean().optional().default(false),
  source:       z.string().max(50).transform(strip).optional(),
  utm_source:   z.string().max(100).transform(strip).optional(),
  utm_medium:   z.string().max(100).transform(strip).optional(),
  utm_campaign: z.string().max(100).transform(strip).optional(),
});

function hashKey(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(publicArcjet, req);
    if (limited) return limited;

    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing bearer token' }, { status: 401 });
    }
    const rawKey = auth.slice(7).trim();
    if (!rawKey) {
      return Response.json({ error: 'Missing bearer token' }, { status: 401 });
    }
    const keyHash = hashKey(rawKey);

    const supabase = createServiceClient();

    const { data: keyRow, error: keyErr } = await supabase
      .from('funnel_api_keys')
      .select('id, funnel_id, revoked_at')
      .eq('key_hash', keyHash)
      .single();

    if (keyErr || !keyRow || keyRow.revoked_at) {
      return Response.json({ error: 'Invalid or revoked key' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, phone, sms_opt_in, source, utm_source, utm_medium, utm_campaign } = parsed.data;

    const { error: insertErr } = await supabase
      .from('funnel_subscribers')
      .insert({
        funnel_id:    keyRow.funnel_id,
        email,
        phone:        phone || null,
        sms_opt_in,
        source:       source || 'website_popup',
        utm_source:   utm_source || null,
        utm_medium:   utm_medium || null,
        utm_campaign: utm_campaign || null,
      });

    if (insertErr) {
      // 23505 = unique_violation (funnel_id, email)
      if ((insertErr as { code?: string }).code === '23505') {
        return Response.json({ message: 'already_subscribed' }, { status: 200 });
      }
      console.error('[external/funnel-subscribe] insert error:', insertErr.code);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Fire-and-forget: stamp the key's last_used_at so revoked/dormant keys can
    // be audited from the portal later. Don't block the user response on it.
    void supabase
      .from('funnel_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRow.id);

    return Response.json({ message: 'subscribed' }, { status: 201 });

  } catch (err) {
    console.error('[external/funnel-subscribe]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
