// supabase/functions/trigger-vapi-call/index.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { lead_id, funnel_id } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single();
  const { data: funnel } = await supabase.from('funnels').select('*').eq('id', funnel_id).single();

  if (!lead || !funnel?.vapi_assistant_id || !funnel?.ai_agent_enabled)
    return new Response('Skipped', { status: 200 });

  const callRes = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('VAPI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assistantId: funnel.vapi_assistant_id,
      customer: { number: lead.phone, name: lead.full_name || '' },
      metadata: { lead_id, funnel_id },
    }),
  });
  const callData = await callRes.json();

  await supabase.from('leads').update({
    vapi_call_id: callData.id,
    status: 'called',
  }).eq('id', lead_id);

  return new Response(JSON.stringify({ call_id: callData.id }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
