// app/api/sms/inbound/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { verifyTwilioWebhook } from '@/lib/security/webhooks';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function POST(req: Request) {
  const limited = await applyRateLimit(funnelArcjet, req);
  if (limited) return limited;

  // Parse Twilio form body
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((v, k) => { params[k] = v.toString(); });

  // Verify Twilio signature — reject if invalid
  if (!verifyTwilioWebhook(req, params))
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });

  const from = params.From;
  const body = params.Body?.trim() || '';
  const supabase = createServiceClient();

  try {
    // Find lead by phone
    const { data: lead } = await supabase
      .from('leads')
      .select('*, funnels(*)')
      .eq('phone', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lead) {
      // Log inbound SMS (no credits consumed for inbound)
      await supabase.from('sms_log').insert({
        lead_id: lead.id,
        funnel_id: lead.funnel_id,
        user_id: lead.user_id,
        direction: 'inbound',
        body,
        credits_used: 0,
      });

      // Stop sequence on any reply (they engaged)
      if (lead.status === 'sms_sequence') {
        await supabase.from('leads')
          .update({ next_sms_at: null })
          .eq('id', lead.id);

        // If affirmative reply: trigger AI call
        const affirmative = /^(yes|yeah|yep|sure|ok|okay|interested|tell me more|i'm in)/i.test(body);
        if (affirmative && lead.funnels?.ai_agent_enabled) {
          supabase.functions
            .invoke('trigger-vapi-call', { body: { lead_id: lead.id, funnel_id: lead.funnel_id } })
            .catch(console.error);
        }
      }

      // Auto-reply via smart-sms-reply (non-blocking)
      supabase.functions
        .invoke('smart-sms-reply', { body: { lead_id: lead.id, inbound_message: body } })
        .catch(console.error);
    }

    // Return empty TwiML (we handle sending separately)
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (err) {
    console.error('[sms/inbound]', err);
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
}
