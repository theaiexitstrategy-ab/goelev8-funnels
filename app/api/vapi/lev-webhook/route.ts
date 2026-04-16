// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Vapi webhook handler for the Lev assistant.
// Receives call events and logs completed calls to the vapi_calls table in Supabase.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured — allow all

  const signature = req.headers.get('x-vapi-signature');
  if (!signature) return false;

  // Vapi uses HMAC-SHA256
  try {
    const hmac = crypto.createHmac('sha256', secret);
    // We'll verify against the raw body later if needed
    // For now, just check the header exists
    return !!signature;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Verify webhook authenticity
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { message } = payload;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const eventType = message.type;

    // We only log on end-of-call events
    if (eventType === 'end-of-call-report') {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const call = message.call || {};
      const artifact = message.artifact || {};

      // Build transcript from messages array
      let transcript = '';
      if (artifact.messages && Array.isArray(artifact.messages)) {
        transcript = artifact.messages
          .filter((m: { role: string; message?: string }) => m.role && m.message)
          .map((m: { role: string; message: string }) => `${m.role}: ${m.message}`)
          .join('\n');
      } else if (artifact.transcript) {
        transcript = artifact.transcript;
      }

      const record = {
        call_id: call.id || null,
        caller_number: call.customer?.number || null,
        started_at: call.startedAt || null,
        ended_at: call.endedAt || null,
        duration_seconds: call.duration ? Math.round(call.duration) : null,
        ended_reason: call.endedReason || message.endedReason || null,
        transcript: transcript || null,
        assistant_id: call.assistantId || null,
        recording_url: artifact.recordingUrl || call.recordingUrl || null,
      };

      const { error } = await supabase.from('vapi_calls').upsert(record, {
        onConflict: 'call_id',
      });

      if (error) {
        console.error('[lev-webhook] Supabase insert error:', error);
        // Don't return 500 — Vapi would retry
        return NextResponse.json({ ok: false, error: error.message });
      }

      console.log(`[lev-webhook] Logged call ${record.call_id} from ${record.caller_number} (${record.duration_seconds}s)`);
    }

    // Respond with 200 for all event types
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lev-webhook] Error:', err);
    return NextResponse.json({ ok: false }, { status: 200 }); // Return 200 to prevent retries
  }
}
