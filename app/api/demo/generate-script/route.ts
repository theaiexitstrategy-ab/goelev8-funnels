// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const FALLBACK_SCRIPTS: Record<string, string> = {
  gym: "Hey! Thanks for reaching out to [name]. I'm the AI assistant here — I didn't want you to wait. Are you looking to get started with training or do you have a specific goal in mind?",
  medspa: "Hi, thanks for contacting [name]. I'm the assistant here — are you interested in a consultation or a specific treatment today?",
  hvac: "Hey, this is [name] following up. I didn't want you waiting — are you dealing with something urgent or looking to schedule service?",
  realestate: "Hi, this is the team at [name]. You reached out and I wanted to connect quickly — are you looking to buy, sell, or just exploring your options?",
  insurance: "Hey, thanks for reaching out to [name]. I'll be quick — are you looking to review your current coverage or explore new options today?",
  studio: "Hey! Thanks for hitting us up at [name]. Are you looking to book studio time or talk about a project you're working on?",
  law: "Hi, thanks for reaching out to [name]. I wanted to make sure we connected — what can I help you with today?",
  other: "Hi, thanks for reaching out to [name]. I wanted to make sure we connected — what can I help you with today?",
};

export async function POST(req: NextRequest) {
  try {
    const { business_type, business_name, city } = await req.json();

    if (!business_type || !business_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return fallback script
      const fallback = (FALLBACK_SCRIPTS[business_type] || FALLBACK_SCRIPTS.other)
        .replace(/\[name\]/g, business_name);
      return NextResponse.json({ script: fallback, fallback: true });
    }

    const client = new Anthropic({ apiKey });

    const typeLabels: Record<string, string> = {
      gym: 'gym / fitness studio',
      medspa: 'med spa / aesthetics clinic',
      hvac: 'HVAC / home services company',
      realestate: 'real estate agency',
      insurance: 'insurance / financial planning firm',
      studio: 'recording / music studio',
      law: 'law firm / legal services',
      other: 'local service business',
    };

    const typeLabel = typeLabels[business_type] || typeLabels.other;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate a natural 4-line AI phone assistant opening script for a ${typeLabel} called ${business_name} in ${city || 'their city'}. Greet the caller, mention the business name, ask what brought them in, and offer to book an appointment. Under 60 words. Conversational and warm. Return ONLY the script text, nothing else.`,
      }],
    });

    const script = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    if (!script) {
      const fallback = (FALLBACK_SCRIPTS[business_type] || FALLBACK_SCRIPTS.other)
        .replace(/\[name\]/g, business_name);
      return NextResponse.json({ script: fallback, fallback: true });
    }

    return NextResponse.json({ script, fallback: false });
  } catch {
    // Return fallback on any error
    let business_type = 'other';
    let business_name = 'our team';
    try {
      const body = await req.clone().json();
      business_type = body.business_type || 'other';
      business_name = body.business_name || 'our team';
    } catch { /* ignore */ }

    const fallback = (FALLBACK_SCRIPTS[business_type] || FALLBACK_SCRIPTS.other)
      .replace(/\[name\]/g, business_name);
    return NextResponse.json({ script: fallback, fallback: true });
  }
}
