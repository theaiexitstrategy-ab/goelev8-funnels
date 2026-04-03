// supabase/functions/send-booking-reminders/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
// Triggered by pg_cron every hour
// Sends 24-hour reminders for upcoming bookings
// Does NOT consume SMS credits (GoElev8 absorbs cost)
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const in23 = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25 = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: upcoming } = await supabase
    .from('booked_slots')
    .select('*, leads(*), funnels(*)')
    .gte('start_at', in23.toISOString())
    .lte('start_at', in25.toISOString())
    .eq('status', 'confirmed')
    .eq('reminder_sent', false);

  let sent = 0;
  for (const slot of (upcoming || [])) {
    const lead = slot.leads as any;
    const funnel = slot.funnels as any;
    if (!lead?.phone || !funnel?.twilio_number) continue;

    const bookingUrl = `https://goelev8.ai/f/${funnel.slug}/book`;
    const startTime = new Date(slot.start_at).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    const body = `Reminder: Your ${funnel.offer || 'appointment'} with ${funnel.business_name} is tomorrow at ${startTime}. Reply CANCEL to reschedule. ${bookingUrl}`;

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: lead.phone, From: funnel.twilio_number, Body: body }),
      }
    );

    await supabase.from('booked_slots').update({ reminder_sent: true }).eq('id', slot.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
