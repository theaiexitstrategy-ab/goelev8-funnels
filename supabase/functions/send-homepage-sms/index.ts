// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    // Supabase webhook sends: { type, table, schema, record, old_record }
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.phone) {
      return new Response(
        JSON.stringify({ error: 'No record or phone in payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id, full_name, phone } = record;

    // Get first name only — never use full name in SMS
    const firstName = (full_name || '')
      .split(' ')[0]
      .trim()
      .replace(/[^a-zA-Z]/g, '') || 'there';

    // Opt-in confirmation SMS
    // Under 160 chars, includes opt-out, includes your URL
    const smsBody =
      `Hey ${firstName}! Thanks for checking out GoElev8.ai. ` +
      `Build your AI lead system free: goelev8.ai/auth/signup ` +
      `Reply STOP to opt out.`;

    // Send via Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_MASTER_NUMBER')!;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To:   phone,
          From: fromNumber,
          Body: smsBody,
        }),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error('Twilio error:', twilioData);
      // Do not throw — still update status so we know it was attempted
    }

    // Update lead status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('platform_leads')
      .update({
        status:      twilioRes.ok ? 'sms_sent' : 'new',
        sms_sent_at: twilioRes.ok ? new Date().toISOString() : null,
      })
      .eq('id', id);

    return new Response(
      JSON.stringify({ sent: twilioRes.ok, sid: twilioData.sid }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[send-homepage-sms]', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
