// supabase/functions/send-sms/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STEP_DELAYS_DAYS = [0, 1, 3, 7, 14];
const SMS_FIELDS = ['sms_day0','sms_day1','sms_day3','sms_day7','sms_day14'];

serve(async (req) => {
  const { lead_id, step, free } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: lead } = await supabase.from('leads')
    .select('*, funnels(*), users(*)').eq('id', lead_id).single();
  if (!lead) return new Response('Lead not found', { status: 404 });

  const user = lead.users as any;
  const funnel = lead.funnels as any;

  // Credit check (skip for free/system messages)
  if (!free) {
    if ((user.sms_credits || 0) <= 0) {
      await supabase.from('leads').update({ next_sms_at: null }).eq('id', lead_id);
      // TODO: send low credits email via Resend
      return new Response('No credits', { status: 402 });
    }
  }

  // Get message body for this step
  const field = SMS_FIELDS[step] as keyof typeof funnel;
  let body: string = funnel[field] || '';
  if (!body) return new Response('No message for step', { status: 200 });

  // Replace [Name] placeholder
  const firstName = (lead.full_name || '').split(' ')[0];
  body = body.replace(/\[Name\]/g, firstName || 'there');

  // Send via Twilio
  const twilioRes = await fetch(
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
  const twilioData = await twilioRes.json();

  // Deduct credit (unless free)
  if (!free) {
    await supabase.rpc('deduct_sms_credit', { p_user_id: user.id });
  }

  // Log SMS
  await supabase.from('sms_log').insert({
    lead_id, funnel_id: funnel.id, user_id: user.id,
    direction: 'outbound', body,
    twilio_sid: twilioData.sid,
    status: twilioData.status || 'sent',
    credits_used: free ? 0 : 1,
    step,
  });

  // Schedule next step or end sequence
  const nextStep = step + 1;
  if (nextStep < STEP_DELAYS_DAYS.length) {
    const nextAt = new Date(Date.now() + STEP_DELAYS_DAYS[nextStep] * 24 * 60 * 60 * 1000);
    await supabase.from('leads').update({
      sms_step: nextStep,
      next_sms_at: nextAt.toISOString(),
    }).eq('id', lead_id);
  } else {
    // Sequence complete
    await supabase.from('leads').update({
      status: 'dead',
      next_sms_at: null,
    }).eq('id', lead_id);
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
