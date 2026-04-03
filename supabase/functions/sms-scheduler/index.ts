// supabase/functions/sms-scheduler/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
// Triggered by pg_cron every 5 minutes.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: due } = await supabase
    .from('leads')
    .select('id, sms_step, funnel_id, user_id')
    .eq('status', 'sms_sequence')
    .lte('next_sms_at', new Date().toISOString())
    .limit(100);

  const results = await Promise.allSettled(
    (due || []).map(lead =>
      supabase.functions.invoke('send-sms', {
        body: { lead_id: lead.id, step: lead.sms_step }
      })
    )
  );

  const processed = results.filter(r => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ processed }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
