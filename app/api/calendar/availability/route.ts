// app/api/calendar/availability/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function GET(req: Request) {
  const limited = await applyRateLimit(publicArcjet, req);
  if (limited) return limited;

  const url = new URL(req.url);
  const funnel_slug = url.searchParams.get('funnel_slug');
  const date = url.searchParams.get('date'); // YYYY-MM-DD

  if (!funnel_slug || !date)
    return Response.json({ error: 'Missing params' }, { status: 400 });

  const supabase = createServiceClient();

  // Get funnel + availability config
  const { data: funnel } = await supabase
    .from('funnels').select('id, user_id').eq('slug', funnel_slug).single();
  if (!funnel) return Response.json({ error: 'Not found' }, { status: 404 });

  const dayOfWeek = new Date(date).getDay();

  const { data: avail } = await supabase
    .from('availability')
    .select('*')
    .eq('funnel_id', funnel.id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single();

  if (!avail) return Response.json({ slots: [] });

  // Generate 30-min slots within availability window
  const slots: string[] = [];
  const [startH, startM] = avail.start_time.split(':').map(Number);
  const [endH, endM] = avail.end_time.split(':').map(Number);

  for (let h = startH; h < endH || (h === endH && 0 < endM); h++) {
    for (const m of [0, 30]) {
      if (h === startH && m < startM) continue;
      if (h === endH && m >= endM) break;
      slots.push(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
    }
  }

  // Remove already-booked slots
  const { data: booked } = await supabase
    .from('booked_slots')
    .select('start_at')
    .eq('funnel_id', funnel.id)
    .gte('start_at', `${date}T00:00:00`)
    .lte('start_at', `${date}T23:59:59`)
    .eq('status', 'confirmed');

  const bookedTimes = new Set((booked || []).map(b => b.start_at));
  const available = slots.filter(s => !bookedTimes.has(s));

  return Response.json({ slots: available, timezone: avail.timezone });
}
