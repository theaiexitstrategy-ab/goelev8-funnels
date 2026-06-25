// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// POST /api/onboard/save-spot  Body: { token }
//   Sends the magic resume link email to the client's email on file.

import { createServiceClient } from '@/lib/db/supabase-service';
import { sendSaveSpotEmail } from '@/lib/onboarding-email';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, email, business_name, brand_color, resume_token')
      .eq('resume_token', token)
      .maybeSingle();
    if (!client) return Response.json({ error: 'Invalid token' }, { status: 404 });
    if (!client.email) return Response.json({ error: 'No email on file for this account' }, { status: 400 });

    const { id, error } = await sendSaveSpotEmail({
      to: client.email,
      name: client.name,
      businessName: client.business_name || 'your account',
      resumeToken: client.resume_token,
      accent: client.brand_color || '#D4AF7A',
    });
    if (error) {
      console.error('[onboard/save-spot] email error:', error);
      return Response.json({ error }, { status: 500 });
    }
    return Response.json({ ok: true, email_id: id });
  } catch (err: any) {
    console.error('[onboard/save-spot]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
