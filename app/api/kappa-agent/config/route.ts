// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Tells the Kappa Chapter Agent page which optional features are switched on.
// Never returns keys or full phone numbers.

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionValue } from '@/lib/kappa-agent/session';
import { liveTestNumbers, liveTextAvailable, maskPhone, stripeTestKey } from '@/lib/kappa-agent/integrations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const live = liveTextAvailable();
  return NextResponse.json({
    agentReady: !!process.env.ANTHROPIC_API_KEY,
    stripeMode: stripeTestKey() ? 'stripe_test' : 'simulated',
    liveTextAvailable: live,
    liveTextNumbers: live ? liveTestNumbers().map(maskPhone) : [],
  });
}
