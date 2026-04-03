// supabase/functions/send-blast/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
// Sends SMS blast to a segment of leads for a funnel
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { blast_id } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: blast } = await supabase
    .from('sms_blasts').select('*, funnels(*), users(*)').eq('id', blast_id).single();
  if (!blast) return new Response('Blast not found', { status: 404 });

  const user = blast.users as any;
  const funnel = blast.funnels as any;

  // Build segment query
  let query = supabase.from('leads').select('id, phone, full_name')
    .eq('funnel_id', blast.funnel_id).eq('user_id', blast.user_id);

  switch (blast.segment) {
    case 'active':
      query = query.eq('status', 'sms_sequence');
      break;
    case 'booked':
      query = query.eq('status', 'booked');
      break;
    case 'stale':
      const staleDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      query = query.lte('updated_at', staleDate);
      break;
    // 'all' — no additional filter
  }

  const { data: leads } = await query;
  if (!leads || leads.length === 0) {
    await supabase.from('sms_blasts').update({ status: 'sent', sent_count: 0 }).eq('id', blast_id);
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Check credits
  if ((user.sms_credits || 0) < leads.length) {
    await supabase.from('sms_blasts').update({ status: 'failed' }).eq('id', blast_id);
    return new Response('Insufficient credits', { status: 402 });
  }

  // Deduct credits upfront
  await supabase.rpc('deduct_sms_credits', { p_user_id: user.id, p_amount: leads.length });

  let sentCount = 0;
  for (const lead of leads) {
    try {
      let body = blast.body || '';
      const firstName = (lead.full_name || '').split(' ')[0];
      body = body.replace(/\[Name\]/g, firstName || 'there');

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

      await supabase.from('sms_log').insert({
        lead_id: lead.id, funnel_id: blast.funnel_id, user_id: blast.user_id,
        direction: 'outbound', body, credits_used: 1, blast_id: blast_id,
      });

      sentCount++;

      // 100ms delay between sends to avoid Twilio rate limits
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`Blast send error for lead ${lead.id}:`, e);
    }
  }

  await supabase.from('sms_blasts').update({
    status: 'sent',
    sent_count: sentCount,
    credits_used: sentCount,
    sent_at: new Date().toISOString(),
  }).eq('id', blast_id);

  return new Response(JSON.stringify({ sent: sentCount }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
