// app/api/leads/import/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { validateCSRF } from '@/lib/security/csrf';
import { createServerClient } from '@/lib/db/supabase-server';
import { createServiceClient } from '@/lib/db/supabase-service';
import { sanitize, phoneSchema } from '@/lib/security/sanitize';

export async function POST(req: Request) {
  const limited = await applyRateLimit(publicArcjet, req);
  if (limited) return limited;
  validateCSRF(req);

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const funnel_id = formData.get('funnel_id') as string;

  if (!file || !funnel_id)
    return Response.json({ error: 'Missing file or funnel_id' }, { status: 400 });

  const text = await file.text();
  const lines = text.split('\n').slice(1); // Skip header row
  const service = createServiceClient();

  // Verify funnel belongs to user
  const { data: funnel } = await service.from('funnels')
    .select('id').eq('id', funnel_id).eq('user_id', session.user.id).single();
  if (!funnel) return Response.json({ error: 'Funnel not found' }, { status: 404 });

  // Get existing phones to check duplicates
  const { data: existing } = await service.from('leads')
    .select('phone').eq('funnel_id', funnel_id);
  const existingPhones = new Set((existing || []).map(l => l.phone));

  let imported = 0, skipped = 0;
  const toInsert: any[] = [];

  for (const line of lines.slice(0, 1000)) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const [name, phone, email] = cols;

    if (!phone) { skipped++; continue; }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!phoneSchema.safeParse(cleanPhone).success) { skipped++; continue; }
    if (existingPhones.has(cleanPhone)) { skipped++; continue; }

    toInsert.push({
      funnel_id, user_id: session.user.id,
      full_name: sanitize(name || ''),
      phone: cleanPhone,
      email: email ? sanitize(email) : null,
      source: 'manual',
      status: 'new', // Do NOT auto-trigger SMS on import
    });
    existingPhones.add(cleanPhone);
    imported++;
  }

  if (toInsert.length > 0) {
    await service.from('leads').insert(toInsert);
  }

  return Response.json({ imported, skipped });
}
