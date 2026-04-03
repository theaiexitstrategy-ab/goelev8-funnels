// app/api/calendar/book/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';
import { z } from 'zod';

const bookSchema = z.object({
  funnel_slug: z.string(),
  start_at:    z.string().datetime(),
  full_name:   z.string().min(1).max(100),
  phone:       z.string().regex(/^\+?[\d\s\-().]{7,15}$/),
  email:       z.string().email().optional(),
  lead_id:     z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const limited = await applyRateLimit(funnelArcjet, req);
  if (limited) return limited;

  const body = await req.json();
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: 'Invalid booking data' }, { status: 400 });

  const { funnel_slug, start_at, full_name, phone, lead_id } = parsed.data;
  const supabase = createServiceClient();

  const { data: funnel } = await supabase
    .from('funnels').select('*').eq('slug', funnel_slug).single();
  if (!funnel) return Response.json({ error: 'Not found' }, { status: 404 });

  // Check for conflict
  const end_at = new Date(new Date(start_at).getTime() + 30 * 60 * 1000).toISOString();
  const { data: conflict } = await supabase
    .from('booked_slots')
    .select('id')
    .eq('funnel_id', funnel.id)
    .eq('start_at', start_at)
    .eq('status', 'confirmed')
    .single();

  if (conflict)
    return Response.json({ error: 'This slot is no longer available' }, { status: 409 });

  // Ensure lead exists
  let resolvedLeadId = lead_id;
  if (!resolvedLeadId) {
    const { data: newLead } = await supabase.from('leads').insert({
      funnel_id: funnel.id, user_id: funnel.user_id,
      full_name, phone, status: 'booked', booked_at: new Date().toISOString(),
    }).select().single();
    resolvedLeadId = newLead?.id;
  } else {
    await supabase.from('leads').update({ status: 'booked', booked_at: new Date().toISOString(), next_sms_at: null }).eq('id', resolvedLeadId);
  }

  // Create booking
  const { data: slot } = await supabase.from('booked_slots').insert({
    user_id: funnel.user_id,
    funnel_id: funnel.id,
    lead_id: resolvedLeadId,
    start_at, end_at, duration_mins: 30, status: 'confirmed',
  }).select().single();

  // Sync to Google Calendar if connected (non-blocking)
  supabase.functions
    .invoke('sync-google-calendar', { body: { slot_id: slot?.id, funnel_id: funnel.id } })
    .catch(console.error);

  // Send confirmation SMS — FREE, does not use credits
  const confirmMsg = `Confirmed! Your ${funnel.offer || 'appointment'} with ${funnel.business_name} is scheduled. Confirmation: ${slot?.confirmation_code}. Reply CANCEL to reschedule.`;
  supabase.functions
    .invoke('send-sms', { body: { to: phone, body: confirmMsg, free: true, user_id: funnel.user_id } })
    .catch(console.error);

  return Response.json({ success: true, confirmation_code: slot?.confirmation_code });
}
