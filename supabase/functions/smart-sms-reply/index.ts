// supabase/functions/smart-sms-reply/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { lead_id, inbound_message } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: lead } = await supabase.from('leads')
    .select('*, funnels(*), users(*)').eq('id', lead_id).single();
  if (!lead) return new Response('Not found', { status: 404 });

  const funnel = lead.funnels as any;
  const user = lead.users as any;

  if ((user.sms_credits || 0) <= 0)
    return new Response('No credits', { status: 402 });

  const { data: history } = await supabase.from('sms_log')
    .select('direction, body').eq('lead_id', lead_id)
    .order('sent_at', { ascending: true }).limit(10);

  const contextMessages = (history || []).map(m => ({
    role: m.direction === 'outbound' ? 'assistant' : 'user',
    content: m.body,
  }));

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 160,
      system: `SMS assistant for ${funnel.business_name}. Specialty: ${funnel.specialty}. Offer: ${funnel.offer}. Keep reply under 160 chars. Warm and natural. Guide toward booking.`,
      messages: [
        ...contextMessages,
        { role: 'user', content: inbound_message },
      ],
    }),
  });
  const claudeData = await claudeRes.json();
  const replyBody = claudeData.content?.[0]?.text?.slice(0, 160) || '';

  if (!replyBody) return new Response('No reply', { status: 200 });

  // Send via Twilio
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: lead.phone, From: funnel.twilio_number, Body: replyBody }),
    }
  );

  await supabase.rpc('deduct_sms_credit', { p_user_id: user.id });
  await supabase.from('sms_log').insert({
    lead_id, funnel_id: funnel.id, user_id: user.id,
    direction: 'outbound', body: replyBody, credits_used: 1,
  });

  return new Response(JSON.stringify({ sent: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
