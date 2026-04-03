// lib/vapi.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export async function createVapiAssistant(params: {
  businessName: string;
  agentScript: string;
  agentOpening: string;
  knowledgebase: string;
}) {
  const res = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${params.businessName} — GoElev8.AI Agent`,
      model: {
        provider: 'anthropic',
        model: 'claude-haiku-4-5-20251001', // Fast for voice
        temperature: 0.7,
        maxTokens: 200,
        messages: [{ role: 'system', content: params.agentScript }],
        knowledgeBase: {
          provider: 'canonical',
          documents: [{
            content: params.knowledgebase,
            title: `${params.businessName} Knowledge Base`,
          }],
        },
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah — professional, warm
        stability: 0.5,
        similarityBoost: 0.8,
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
        smartFormat: true,
      },
      firstMessage: params.agentOpening,
      firstMessageMode: 'assistant-speaks-first',
      endCallMessage: 'You will receive a confirmation text shortly. Looking forward to connecting!',
      endCallPhrases: ['goodbye','bye','not interested','remove me','stop calling'],
      analysisPlan: {
        summaryPrompt: 'Did the lead agree to book? What was their goal? Any objections?',
        successEvaluationPrompt: 'Did the lead agree to schedule? Reply with exactly one of: booked | interested | not_interested | no_answer',
        successEvaluationRubric: 'DescriptiveScale',
      },
      maxDurationSeconds: 300,
      silenceTimeoutSeconds: 30,
      backgroundSound: 'off',
      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
    }),
  });

  if (!res.ok) throw new Error(`Vapi error: ${res.status}`);
  return res.json();
}
