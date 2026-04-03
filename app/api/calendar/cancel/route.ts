// app/api/calendar/cancel/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function POST(req: Request) {
  const limited = await applyRateLimit(funnelArcjet, req);
  if (limited) return limited;

  const { confirmation_code } = await req.json();
  if (!confirmation_code) return Response.json({ error: 'Missing code' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: slot } = await supabase
    .from('booked_slots').select('*, funnels(*)').eq('confirmation_code', confirmation_code).single();
  if (!slot) return Response.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('booked_slots').update({ status: 'cancelled' }).eq('id', slot.id);
  await supabase.from('leads').update({ status: 'new', booked_at: null }).eq('id', slot.lead_id);

  return Response.json({ success: true });
}
