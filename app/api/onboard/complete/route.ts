// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/onboard/complete  Body: { token }
//   Marks the client's onboarding complete and notifies the admin.

import { createServiceClient } from '@/lib/db/supabase-service';
import { sendAdminNotificationEmail } from '@/lib/onboarding-email';

const KEYWORD_NETWORK_TAG = 'iSlay Studios';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: client } = await supabase
      .from('clients')
      .select('id, business_name, onboarding_status')
      .eq('resume_token', token)
      .maybeSingle();
    if (!client) return Response.json({ error: 'Invalid token' }, { status: 404 });

    // Hidden keyword network tag — always added.
    const { data: info } = await supabase
      .from('client_info').select('keywords').eq('client_id', client.id).maybeSingle();
    const existingKeywords: string[] = (info?.keywords as string[]) ?? [];
    if (!existingKeywords.includes(KEYWORD_NETWORK_TAG)) {
      await supabase
        .from('client_info')
        .update({ keywords: [...existingKeywords, KEYWORD_NETWORK_TAG], updated_at: new Date().toISOString() })
        .eq('client_id', client.id);
    }

    await supabase
      .from('clients')
      .update({ onboarding_status: 'complete', onboarding_step: 6 })
      .eq('id', client.id);

    // Admin notification — best effort.
    const { data: fullInfo } = await supabase.from('client_info').select('*').eq('client_id', client.id).maybeSingle();
    const { data: assets } = await supabase
      .from('client_assets')
      .select('label, page_position, file_url')
      .eq('client_id', client.id)
      .order('page_position', { ascending: true })
      .order('rank', { ascending: true });
    const { error: emailErr } = await sendAdminNotificationEmail({
      businessName: client.business_name || 'Unknown',
      clientId: client.id,
      info: fullInfo ?? {},
      assets: (assets ?? []) as Array<{ label: string | null; page_position: string | null; file_url: string }>,
    });
    if (emailErr) console.error('[onboard/complete] admin email error:', emailErr);

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[onboard/complete]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
