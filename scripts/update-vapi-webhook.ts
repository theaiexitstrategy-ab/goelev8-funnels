#!/usr/bin/env npx tsx
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Run AFTER deploying the webhook route to update the Lev assistant with the webhook URL.
//
// Usage:
//   VAPI_API_KEY=your-key VAPI_LEV_ASSISTANT_ID=asst-id VAPI_WEBHOOK_SECRET=secret npx tsx scripts/update-vapi-webhook.ts

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = process.env.VAPI_LEV_ASSISTANT_ID;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;

if (!VAPI_API_KEY || !ASSISTANT_ID) {
  console.error('ERROR: VAPI_API_KEY and VAPI_LEV_ASSISTANT_ID are required.');
  process.exit(1);
}

async function main() {
  console.log('[1/1] Updating Lev assistant webhook URL...');

  const body: Record<string, string> = {
    serverUrl: 'https://goelev8.ai/api/vapi/lev-webhook',
  };
  if (WEBHOOK_SECRET) {
    body.serverUrlSecret = WEBHOOK_SECRET;
  }

  const res = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('FAILED:', res.status, err);
    process.exit(1);
  }

  const updated = await res.json();
  console.log(`  ✓ Webhook URL set: ${updated.serverUrl}`);
  if (WEBHOOK_SECRET) console.log('  ✓ Webhook secret configured.');
  console.log('\nDone. Lev call logs will now post to /api/vapi/lev-webhook.');
}

main().catch(err => { console.error(err); process.exit(1); });
