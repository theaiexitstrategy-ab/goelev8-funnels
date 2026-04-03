// app/api/vapi/webhook/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { verifyVapiWebhook } from '@/lib/security/webhooks';
import { createServiceClient } from '@/lib/db/supabase-service';

export async function POST(req: Request) {
  const limited = await applyRateLimit(funnelArcjet, req);
  if (limited) return limited;

  if (!verifyVapiWebhook(req))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json();
  const supabase = createServiceClient();

  try {
    if (payload.type === 'end-of-call-report') {
      const { call, analysis } = payload;
      const leadId = call?.metadata?.lead_id;
      if (!leadId) return Response.json({ received: true });

      const outcome = analysis?.successEvaluation?.toLowerCase() || 'no_answer';
      // outcome: 'booked' | 'interested' | 'not_interested' | 'no_answer'

      const updates: Record<string, any> = {
        vapi_call_id: call.id,
        call_outcome: outcome,
        call_duration_seconds: Math.round((call.endedAt - call.startedAt) / 1000) || null,
        call_transcript: call.transcript || null,
      };

      if (outcome === 'booked') {
        updates.status = 'booked';
        updates.next_sms_at = null; // Cancel sequence — booked
        updates.booked_at = new Date().toISOString();
      } else if (outcome === 'not_interested') {
        updates.status = 'dead';
        updates.next_sms_at = null; // Cancel sequence
      } else {
        updates.status = 'sms_sequence'; // Keep sequence running
      }

      await supabase.from('leads').update(updates).eq('id', leadId);
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error('[vapi/webhook]', err);
    return Response.json({ error: 'Handler error' }, { status: 500 });
  }
}
