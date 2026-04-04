// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
// Triggered on paid plan activation (not during trial)
// GoElev8 registers ALL client numbers under the master A2P account

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { user_id } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: user } = await supabase.from('users').select('*').eq('id', user_id).single();
  if (!user || user.a2p_status !== 'pending') return new Response('Skipped', { status: 200 });

  // Register brand under GoElev8 master Twilio account
  const brandRes = await fetch(
    `https://messaging.twilio.com/v1/a2p/BrandRegistrations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        CustomerProfileSid: Deno.env.get('TWILIO_A2P_PROFILE_SID')!,
        A2PProfileBundleSid: Deno.env.get('TWILIO_A2P_PROFILE_SID')!,
      }),
    }
  );
  const brandData = await brandRes.json();

  await supabase.from('users').update({
    a2p_brand_sid: brandData.sid,
    a2p_status: 'submitted',
  }).eq('id', user_id);

  return new Response(JSON.stringify({ submitted: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
