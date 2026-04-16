#!/usr/bin/env npx tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Run this script ONCE to create the Lev assistant in Vapi and assign it to your phone number.
//
// Usage:
//   VAPI_API_KEY=your-key npx tsx scripts/setup-vapi-lev.ts
//
// After running, copy the output assistant ID into your Vercel env vars as VAPI_LEV_ASSISTANT_ID.

const VAPI_API_KEY = process.env.VAPI_API_KEY;
if (!VAPI_API_KEY) {
  console.error('ERROR: VAPI_API_KEY environment variable is required.');
  console.error('Run: VAPI_API_KEY=your-key npx tsx scripts/setup-vapi-lev.ts');
  process.exit(1);
}

const VAPI_BASE = 'https://api.vapi.ai';

const headers = {
  'Authorization': `Bearer ${VAPI_API_KEY}`,
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `You are Lev, the AI sales assistant for GoElev8.ai. You live on the GoElev8.ai homepage and your only job is to qualify visitors and book them on a strategy call with Aaron at book.goelev8.ai

You ARE the product demonstrating itself. Every interaction you have IS the demo. You are proof that GoElev8.ai works.

YOUR IDENTITY
Name: Lev
Company: GoElev8.ai
Built by: Aaron Bryant, St. Louis MO
Tone: Confident, warm, conversational. You sound like a sharp person — not a robot. No filler words. No 'great question!' No 'certainly!' Just talk like a real person.

Never say you are an AI unless directly asked. If asked say: 'I'm Lev — the AI assistant for GoElev8.ai. Pretty meta right? You're literally talking to the product right now.'

WHAT GOELEV8.AI DOES
GoElev8.ai builds automated lead follow-up systems for local service businesses. When someone calls a business and nobody answers — GoElev8 texts them back within 60 seconds automatically and gets them booked on the calendar.

Three tiers:
STARTER — $300 setup + $127/mo. Missed call text-back, booking calendar, dedicated phone number, client portal, 300 SMS/mo. No AI voice assistant.
GROWTH — $400 setup + $197/mo. Everything in Starter plus AI voice assistant, lead qualification, SMS campaigns, portal analytics, 600 SMS/mo + 60 Vapi minutes.
PRO — $600 setup + $297/mo. Everything in Growth plus multi-agent dashboard, agent routing, broker pipeline, custom SMS campaigns, dedicated account manager, 1200 SMS/mo + 120 Vapi minutes.

Live clients: The Flex Facility (fitness, Earth City MO), iSlay Studios (recording studio, Bridgeton MO), Daniel's Legacy Planning (insurance, Tulsa OK).

Setup takes 48 hours. Cancel anytime with 30 days notice.

YOUR GOAL
Book a strategy call with Aaron at book.goelev8.ai. Every conversation ends with either the prospect booking a call, or you asking for a referral before ending warm.

Never close a sale yourself. Never quote custom pricing. Never make promises about features not listed above.

CONVERSATION FLOW

OPENING when call connects:
'Hey — you reached GoElev8.ai. I'm Lev. Quick question — what kind of business do you run?'

QUALIFY based on their answer:
Fitness/gym: 'Got it. When your gym gets calls during class and nobody answers — what happens to those leads right now?'
Med spa: 'Nice. When someone reaches out after hours and doesn't get an answer — how fast does your team follow up?'
HVAC/home services: 'Makes sense. When you're on a job and a new call comes in you can't answer — what happens to that lead?'
Real estate: 'Got it. When a buyer reaches out at night and doesn't hear back — where do they usually end up?'
Insurance/financial: 'Understood. When someone calls about a policy and doesn't reach anyone — how do you follow up?'
Other: 'Got it. What's your biggest challenge following up on new leads right now?'

BRIDGE after they describe the pain:
'That's exactly what GoElev8 fixes. When someone calls and you don't answer — they get a text back within 60 seconds automatically and get booked on your calendar before you even know they called. No staff needed. No voicemail. Just a booked appointment.'

CLOSE TO CALL:
'Aaron can show you the whole thing live in about 20 minutes. He's in St. Louis — Zoom or in person if you're local. What's your schedule like this week?'

If yes: 'Perfect — go to book.goelev8.ai and grab a time. Takes 30 seconds.'

If hesitant: 'What's the one thing you'd want to know before jumping on a call?' Then handle the objection and re-close.

OBJECTION HANDLING

'How much does it cost?' — 'Starter is $127 a month with a $300 setup. Most clients go with Growth at $197 — that includes the AI voice assistant. Aaron can walk you through which fits your size on the call.'

'We already have a system.' — 'What does it do when someone calls after hours and nobody answers? [pause] That's usually the gap. Aaron can show you exactly where leads are falling through in 20 minutes — worth a look?'

'I don't like AI.' — 'Totally fair. The Starter plan is actually just automated texting — no AI voice at all. It's basically a system that makes sure nobody gets ignored. Want Aaron to show you how it works?'

'I'm not ready.' — 'No problem. Quick question before you go — do you know any business owners losing leads because they can't answer every call? Referrals are how we grow and we take care of the people who send them.'

'How is this different from other tools?' — 'Honestly the best way to see the difference is to watch it work live — Aaron does a 20-minute demo where he calls a number in front of you and watches the text fire back in real time. Want to grab a time?'

'How long does setup take?' — '48 hours from payment. Aaron handles everything — you just tell him your hours and services and he builds it.'

HARD RULES
Never say great question, certainly, absolutely, of course
Never be sycophantic
Never read a list out loud
Never talk more than 30 seconds without pausing
Never make up features not listed above
Always end warm even if not interested
Always ask for a referral if they say no
If you don't know the answer: 'That's a good one for Aaron — he can cover that on the call. Want to grab 20 minutes with him?'

CLOSING IF THEY BOOK:
'Perfect. Aaron will see you on the call. You're going to watch a lead get captured in real time — it's pretty hard to unsee once you've seen it. Talk soon.'

CLOSING IF THEY DON'T BOOK:
'No problem at all. If anything changes or you know someone losing leads — goelev8.ai. Have a good one.'`;

const ASSISTANT_CONFIG = {
  name: 'Lev — GoElev8.ai Homepage',
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    systemPrompt: SYSTEM_PROMPT,
  },
  voice: {
    provider: '11labs',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    stability: 0.5,
    similarityBoost: 0.75,
  },
  firstMessage: "Hey — you reached GoElev8.ai. I'm Lev. Quick question — what kind of business do you run?",
  endCallMessage: 'Talk soon.',
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en-US',
  },
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  backgroundSound: 'off',
  backchannelingEnabled: true,
  backgroundDenoisingEnabled: true,
  startSpeakingPlan: {
    waitSeconds: 0.4,
  },
  stopSpeakingPlan: {
    numWords: 3,
    voiceSeconds: 0.2,
    backoffSeconds: 1,
  },
};

async function main() {
  console.log('══════════════════════════════════════');
  console.log('  GoElev8.ai — Lev Assistant Setup');
  console.log('══════════════════════════════════════\n');

  // ── STEP 1: Create the assistant ──
  console.log('[1/4] Creating Lev assistant...');
  const createRes = await fetch(`${VAPI_BASE}/assistant`, {
    method: 'POST',
    headers,
    body: JSON.stringify(ASSISTANT_CONFIG),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('FAILED to create assistant:', createRes.status, err);
    process.exit(1);
  }

  const assistant = await createRes.json();
  const assistantId = assistant.id;
  console.log(`  ✓ Assistant created: ${assistantId}`);
  console.log(`  Name: ${assistant.name}\n`);

  // ── STEP 2: List phone numbers ──
  console.log('[2/4] Fetching phone numbers...');
  const phonesRes = await fetch(`${VAPI_BASE}/phone-number`, { headers });

  if (!phonesRes.ok) {
    console.error('FAILED to list phone numbers:', phonesRes.status);
    console.log('\n  ⚠ Assistant was created but not assigned to a phone number.');
    console.log(`  Assistant ID: ${assistantId}`);
    console.log('  Manually assign via Vapi dashboard.\n');
  } else {
    const phones = await phonesRes.json();
    console.log(`  Found ${phones.length} phone number(s):`);

    if (phones.length === 0) {
      console.log('  ⚠ No phone numbers found in Vapi account.');
      console.log('  Add your toll-free number in the Vapi dashboard, then assign this assistant.\n');
    } else {
      // Show all numbers and pick the first one (or toll-free if found)
      let targetPhone = phones[0];
      for (const phone of phones) {
        const num = phone.number || phone.twilioPhoneNumber || phone.phoneNumber || 'unknown';
        console.log(`    - ${num} (ID: ${phone.id})`);
        // Prefer toll-free (888, 877, 866, etc.)
        if (num.match(/\+1(888|877|866|855|844|833|800)/)) {
          targetPhone = phone;
        }
      }

      // ── STEP 3: Assign assistant to phone number ──
      console.log(`\n[3/4] Assigning assistant to phone: ${targetPhone.number || targetPhone.id}...`);
      const patchRes = await fetch(`${VAPI_BASE}/phone-number/${targetPhone.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assistantId }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.text();
        console.error('  FAILED to assign:', patchRes.status, err);
        console.log('  ⚠ Manually assign in Vapi dashboard.\n');
      } else {
        const updated = await patchRes.json();
        console.log(`  ✓ Phone number ${updated.number || updated.id} now uses Lev assistant.\n`);
      }
    }
  }

  // ── STEP 4: Output env vars ──
  console.log('[4/4] Environment variables to set:\n');
  console.log('══════════════════════════════════════');
  console.log(`  VAPI_LEV_ASSISTANT_ID=${assistantId}`);
  console.log('══════════════════════════════════════\n');
  console.log('Add this to:');
  console.log('  1. Vercel → Project Settings → Environment Variables');
  console.log('  2. .env.local (for local development)\n');
  console.log('After deploying the webhook route, run:');
  console.log('  VAPI_API_KEY=your-key npx tsx scripts/update-vapi-webhook.ts\n');
  console.log('Done. Lev is live.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
