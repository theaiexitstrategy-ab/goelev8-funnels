// app/api/chat/message/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import Anthropic from '@anthropic-ai/sdk';
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceClient } from '@/lib/db/supabase-service';
import { sanitize } from '@/lib/security/sanitize';

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(funnelArcjet, req);
    if (limited) return limited;

    const { funnel_slug, message, session_token } = await req.json();
    if (!funnel_slug || !message) return Response.json({ error: 'Missing params' }, { status: 400 });

    const cleanMsg = sanitize(String(message)).slice(0, 500);
    const supabase = createServiceClient();

    // Load funnel
    const { data: funnel } = await supabase
      .from('funnels').select('*').eq('slug', funnel_slug).eq('is_active', true).single();
    if (!funnel || !funnel.chat_widget_enabled)
      return Response.json({ error: 'Chat not available' }, { status: 404 });

    // Get or create chat session
    let session;
    if (session_token) {
      const { data } = await supabase.from('chat_sessions')
        .select('*').eq('session_token', session_token).single();
      session = data;
    }
    if (!session) {
      const { data } = await supabase.from('chat_sessions')
        .insert({ funnel_id: funnel.id }).select().single();
      session = data;
    }

    // Build messages array for Claude
    const history = (session?.messages || []) as Array<{role: string; content: string}>;
    const messages = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: cleanMsg },
    ];

    const systemPrompt = `You are a helpful assistant for ${funnel.business_name}.
${funnel.specialty ? `Specialty: ${funnel.specialty}` : ''}
${funnel.offer ? `Current offer: ${funnel.offer}` : ''}
${funnel.location ? `Location: ${funnel.location}` : ''}

Your goal: Answer questions helpfully and naturally guide the conversation toward booking.
When the user expresses interest in booking or getting started, collect their name and phone number.
When you have their name and phone, output this EXACTLY on its own line:
LEAD_CAPTURED:{"name":"[name]","phone":"[phone]"}

Keep responses under 2 sentences. Be warm and natural. Never sound like a bot.`;

    // Call Claude Haiku (fast + cheap for chat)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    let reply = (res.content[0] as any).text || '';

    // Check for lead capture
    const captureMatch = reply.match(/LEAD_CAPTURED:(\{[^}]+\})/);
    if (captureMatch && !session?.lead_captured) {
      try {
        const { name, phone } = JSON.parse(captureMatch[1]);
        if (name && phone) {
          // Insert lead + start SMS sequence
          await supabase.from('leads').insert({
            funnel_id: funnel.id,
            user_id: funnel.user_id,
            full_name: sanitize(name),
            phone: phone.replace(/[^\d+]/g, ''),
            source: 'chat_widget',
            status: 'sms_sequence',
            sms_step: 0,
            next_sms_at: new Date(Date.now() + 60 * 1000).toISOString(),
          });
          await supabase.from('chat_sessions')
            .update({ lead_captured: true }).eq('id', session.id);
        }
      } catch { /* Parse failed, continue */ }
      reply = reply.replace(/LEAD_CAPTURED:[^\n]+\n?/, '').trim();
    }

    // Update session history
    const updatedMessages = [
      ...history,
      { role: 'user', content: cleanMsg },
      { role: 'assistant', content: reply },
    ].slice(-20); // Keep last 20 messages only

    await supabase.from('chat_sessions')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    return Response.json({ reply, session_token: session.session_token });

  } catch (err) {
    console.error('[chat/message]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
