// scripts/seed-demo-accounts.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Seeds two demo accounts with pre-built funnels:
//   - the-flex-facility (fitness template)
//   - islay-studios (studio template)
//
// Usage: npx ts-node scripts/seed-demo-accounts.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const DEMO_ACCOUNTS = [
  {
    email: 'demo-fitness@goelev8.ai',
    password: 'demo-fitness-2026!',
    full_name: 'Marcus Johnson',
    funnel: {
      slug: 'the-flex-facility',
      business_name: 'The Flex Facility',
      industry: 'fitness',
      template_key: 'fitness',
      location: 'Atlanta, GA',
      phone: '+14045551234',
      specialty: 'High-intensity functional training for busy professionals',
      offer: 'Free 7-Day Trial + Body Composition Analysis',
      headline: 'Transform Your Body in 90 Days',
      subheadline: 'Atlanta\'s premier functional training facility. Get a free 7-day trial and personalized body composition analysis — no commitment required.',
      cta_text: 'Claim Your Free Trial',
      accent_color: '#00CFFF',
      trust_bullet_1: '★ 500+ members transformed since 2022',
      trust_bullet_2: '✓ Certified trainers with 10+ years experience',
      trust_bullet_3: '⚡ Results guaranteed or your month is free',
      sms_day0: 'Hey [Name]! Marcus here from The Flex Facility. What fitness goal are you working toward right now?',
      sms_day1: '[Name], quick tip: the #1 reason people plateau is inconsistent training frequency. Even 3x/week changes everything. Want to see our schedule?',
      sms_day3: 'Your free 7-day trial is still waiting, [Name]. Most people who start see visible changes by day 5. Ready to lock in your spot?',
      sms_day7: 'Hey [Name] — just checking in. Still interested in the free trial? Simple yes or no works.',
      sms_day14: '[Name], we just opened 3 new morning slots that fill fast. Want me to save one for you? Last chance before they\'re gone.',
    },
  },
  {
    email: 'demo-studio@goelev8.ai',
    password: 'demo-studio-2026!',
    full_name: 'Islay Monroe',
    funnel: {
      slug: 'islay-studios',
      business_name: 'Islay Studios',
      industry: 'studio',
      template_key: 'studio',
      location: 'Nashville, TN',
      phone: '+16155559876',
      specialty: 'Professional recording and mixing for independent artists',
      offer: 'Free 1-Hour Studio Session + Mix Consultation',
      headline: 'Your Sound, Perfected',
      subheadline: 'Nashville\'s boutique recording studio for indie artists. Book a free 1-hour session and hear the difference professional mixing makes.',
      cta_text: 'Book Your Free Session',
      accent_color: '#9B59FF',
      trust_bullet_1: '★ 200+ tracks mixed and mastered',
      trust_bullet_2: '✓ Grammy-nominated engineer on staff',
      trust_bullet_3: '⚡ 48-hour turnaround on all mixes',
      sms_day0: 'Hey [Name]! Islay here from Islay Studios. What kind of project are you working on right now?',
      sms_day1: '[Name], pro tip: the difference between a good mix and a great mix is the room. Our treated rooms capture every detail. Want to hear a sample?',
      sms_day3: 'Your free studio hour is still available, [Name]. Most artists leave their session with a radio-ready rough mix. Want to book?',
      sms_day7: 'Hey [Name] — still thinking about that free session? Yes or no, just let me know.',
      sms_day14: '[Name], we just had a cancellation this week. Perfect time to grab that free hour before our schedule fills up again.',
    },
  },
];

async function seed() {
  console.log('Seeding demo accounts...\n');

  for (const account of DEMO_ACCOUNTS) {
    console.log(`Creating: ${account.funnel.business_name}`);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });

    if (authError) {
      // User may already exist — try to find them
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === account.email);
      if (existing) {
        console.log(`  User exists: ${existing.id}`);
        // Check if funnel exists
        const { data: existingFunnel } = await supabase
          .from('funnels').select('id').eq('slug', account.funnel.slug).single();
        if (existingFunnel) {
          console.log(`  Funnel exists: ${account.funnel.slug} — skipping\n`);
          continue;
        }
        // Create funnel for existing user
        await createUserAndFunnel(existing.id, account);
        continue;
      }
      console.error(`  Error creating user: ${authError.message}`);
      continue;
    }

    const userId = authData.user!.id;
    await createUserAndFunnel(userId, account);
  }

  console.log('\nDone! Demo funnels:');
  console.log('  → goelev8.ai/f/the-flex-facility');
  console.log('  → goelev8.ai/f/islay-studios');
}

async function createUserAndFunnel(userId: string, account: typeof DEMO_ACCOUNTS[0]) {
  // 2. Insert user record
  await supabase.from('users').upsert({
    id: userId,
    email: account.email,
    full_name: account.full_name,
    tier: 'scale', // Demo accounts get full access
    is_demo: true,
    sms_credits: 9999,
  });

  // 3. Insert funnel
  const { data: funnel, error: funnelError } = await supabase.from('funnels').insert({
    user_id: userId,
    ...account.funnel,
    is_active: true,
    ai_agent_enabled: true,
    chat_widget_enabled: true,
    sms_enabled: true,
    store_enabled: true,
    page_url: `https://goelev8.ai/f/${account.funnel.slug}`,
  }).select().single();

  if (funnelError) {
    console.error(`  Error creating funnel: ${funnelError.message}`);
    return;
  }

  // 4. Insert default availability (Mon-Fri 9am-5pm)
  for (let day = 1; day <= 5; day++) {
    await supabase.from('availability').insert({
      funnel_id: funnel.id,
      user_id: userId,
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      timezone: 'America/New_York',
      is_active: true,
    });
  }

  console.log(`  ✓ Created: ${account.funnel.slug} (user: ${userId})\n`);
}

seed().catch(console.error);
