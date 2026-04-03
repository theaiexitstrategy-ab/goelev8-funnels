// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
// Run ONCE after Session 3: npx ts-node scripts/seed-demo-accounts.ts

import { createServiceClient } from '../lib/db/supabase-service';

const DEMOS = [
  {
    email:         'demo-fitness@goelev8.ai',
    full_name:     'The Flex Facility Demo',
    is_demo:       true,
    tier:          'scale' as const,
    demo_vertical: 'fitness',
    demo_label:    'Fitness Studio Demo',
    demo_slug:     'the-flex-facility',
    prompt: `Athletic training facility in Earth City, MO called The Flex Facility.
      Coach Kenny Sims specializes in strength training, bodybuilding prep, and
      performance coaching for athletes and adults who want to lose weight, build
      muscle, or compete. Free 1-on-1 assessment includes a full movement screen
      and personalized training roadmap. No commitment required.`,
  },
  {
    email:         'demo-studio@goelev8.ai',
    full_name:     'iSlay Studios Demo',
    is_demo:       true,
    tier:          'scale' as const,
    demo_vertical: 'studio',
    demo_label:    'Recording Studio Demo',
    demo_slug:     'islay-studios',
    prompt: `Professional recording studio in St. Louis, MO called iSlay Studios.
      Specializes in recording, mixing, mastering, and full music production for
      independent artists and labels. Offering a free 1-hour intro session for
      new artists to experience the studio before committing to a package.
      State-of-the-art equipment, experienced engineers, flexible scheduling.`,
  },
];

async function seedDemos() {
  const supabase = createServiceClient();
  for (const demo of DEMOS) {
    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: crypto.randomUUID(), // Random — demo accounts don't log in normally
      email_confirm: true,
    });
    if (authError) { console.error(`Auth error for ${demo.email}:`, authError); continue; }

    // 2. Insert user record
    await supabase.from('users').insert({
      id: authUser.user!.id,
      email: demo.email,
      full_name: demo.full_name,
      is_demo: true,
      tier: demo.tier,
      demo_vertical: demo.demo_vertical,
      demo_label: demo.demo_label,
      demo_slug: demo.demo_slug,
      sms_credits: 9999, // Demo accounts have unlimited credits
    });

    // 3. Call /api/funnel/generate via fetch (platform must be running)
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/funnel/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-seed': process.env.ADMIN_EMAIL! },
      body: JSON.stringify({ prompt: demo.prompt, user_id: authUser.user!.id }),
    });
    const data = await res.json();
    console.log(`✓ ${demo.demo_label}: ${data.url}`);
  }
}

seedDemos().catch(console.error);
