-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
--
-- Hush AI schema — users, profiles, promoters, models, events, keywords,
-- passes, bookings, streams, tips, credits ledger, boosts, posts,
-- connections, CRM contacts, network, video interviews.
--
-- RLS is enabled on every hush_* table. User-initiated reads/writes go
-- through these policies; financial flows (creating passes after Stripe
-- checkout, granting credits after pack purchase, splitting tip revenue,
-- etc.) run server-side with the service role and bypass RLS by design.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE hush_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'promoter', 'model', 'admin')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'hustle', 'pro', 'mogul')),
  stage_name TEXT,
  legal_name_encrypted TEXT,
  city TEXT,
  phone TEXT,
  credit_balance INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  ig_handle TEXT,
  tt_handle TEXT,
  sc_handle TEXT,
  x_handle TEXT,
  of_url TEXT,
  of_verified BOOLEAN DEFAULT FALSE,
  ig_verified BOOLEAN DEFAULT FALSE,
  ig_followers INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  connections_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_promoters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT NOT NULL,
  keyword_prefix TEXT NOT NULL UNIQUE,
  twilio_number TEXT,
  number_status TEXT DEFAULT 'shared' CHECK (number_status IN ('shared', 'dedicated', 'vanity')),
  subdomain TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  monthly_credit_allowance INTEGER DEFAULT 0,
  network_parent_id UUID REFERENCES hush_promoters(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id) ON DELETE CASCADE UNIQUE,
  badge TEXT DEFAULT 'rising' CHECK (badge IN ('rising', 'featured', 'elite')),
  rate_cash DECIMAL(10,2) DEFAULT 0,
  rate_credits INTEGER DEFAULT 0,
  events_worked INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  show_rate DECIMAL(5,2) DEFAULT 100,
  can_stream BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  unlock_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  doors_open TIMESTAMPTZ,
  capacity INTEGER DEFAULT 200,
  age_restriction TEXT DEFAULT '21+',
  dress_code TEXT,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended', 'cancelled')),
  posh_url TEXT,
  eventbrite_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES hush_events(id) ON DELETE CASCADE,
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id),
  keyword TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('vip', 'general', 'new')),
  price DECIMAL(10,2) NOT NULL,
  booking_url TEXT NOT NULL,
  ai_reply TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES hush_users(id),
  event_id UUID NOT NULL REFERENCES hush_events(id),
  keyword_id UUID REFERENCES hush_keywords(id),
  tier TEXT NOT NULL CHECK (tier IN ('vip', 'general', 'new')),
  price_paid DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  party_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'cancelled')),
  checked_in_at TIMESTAMPTZ,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_model_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES hush_models(id),
  event_id UUID NOT NULL REFERENCES hush_events(id),
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id),
  rate_cash DECIMAL(10,2),
  rate_credits INTEGER,
  offer_type TEXT CHECK (offer_type IN ('cash', 'credits', 'both', 'entry')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'checked_in', 'paid')),
  checked_in_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES hush_models(id),
  event_id UUID REFERENCES hush_events(id),
  title TEXT NOT NULL,
  ppv_price DECIMAL(10,2),
  is_free BOOLEAN DEFAULT FALSE,
  tip_jar_enabled BOOLEAN DEFAULT TRUE,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  model_earnings DECIMAL(10,2) DEFAULT 0,
  hush_cut DECIMAL(10,2) DEFAULT 0,
  promoter_cut DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  daily_room_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE hush_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES hush_streams(id),
  from_user_id UUID NOT NULL REFERENCES hush_users(id),
  model_id UUID NOT NULL REFERENCES hush_models(id),
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  model_cut DECIMAL(10,2) NOT NULL,
  hush_cut DECIMAL(10,2) NOT NULL,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_credits_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'allowance', 'boost', 'model_unlock', 'stream_access', 'tip', 'refund', 'bonus')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id),
  boost_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('event', 'profile', 'model', 'stream')),
  target_id UUID NOT NULL,
  credits_spent INTEGER NOT NULL,
  is_auto BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES hush_users(id),
  event_id UUID REFERENCES hush_events(id),
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'story', 'stream')),
  caption TEXT,
  city TEXT,
  emoji TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES hush_users(id),
  to_user_id UUID NOT NULL REFERENCES hush_users(id),
  status TEXT DEFAULT 'connected' CHECK (status IN ('pending', 'connected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE hush_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  tier TEXT DEFAULT 'regular' CHECK (tier IN ('vip', 'regular', 'new')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'paste', 'hush_signup')),
  events_attended INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hush_network (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mogul_id UUID NOT NULL REFERENCES hush_promoters(id),
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id),
  monthly_override DECIMAL(10,2) DEFAULT 20.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mogul_id, promoter_id)
);

CREATE TABLE hush_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promoter_id UUID NOT NULL REFERENCES hush_promoters(id),
  model_id UUID NOT NULL REFERENCES hush_models(id),
  event_id UUID REFERENCES hush_events(id),
  daily_room_id TEXT,
  daily_room_url TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE RLS ON EVERY TABLE
-- ============================================================

ALTER TABLE hush_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_model_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_interviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================
-- Note: service-role API routes (Stripe webhooks, payment intents,
-- credit grants, tip splits) bypass RLS by design. The policies below
-- govern only end-user-initiated reads and writes from the client.

-- hush_users
CREATE POLICY "users_select_own" ON hush_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_self" ON hush_users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON hush_users FOR UPDATE USING (auth.uid() = id);

-- hush_profiles — public to read if is_public, owner full control
CREATE POLICY "profiles_select_public_or_own" ON hush_profiles FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "profiles_insert_self" ON hush_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON hush_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete_own" ON hush_profiles FOR DELETE USING (auth.uid() = user_id);

-- hush_promoters — public to read brand-level info, owner manages own row
CREATE POLICY "promoters_select_public" ON hush_promoters FOR SELECT USING (TRUE);
CREATE POLICY "promoters_insert_self" ON hush_promoters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "promoters_update_own" ON hush_promoters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "promoters_delete_own" ON hush_promoters FOR DELETE USING (auth.uid() = user_id);

-- hush_models — public to read marketplace listings, owner manages own row
CREATE POLICY "models_select_public" ON hush_models FOR SELECT USING (TRUE);
CREATE POLICY "models_insert_self" ON hush_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "models_update_own" ON hush_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "models_delete_own" ON hush_models FOR DELETE USING (auth.uid() = user_id);

-- hush_events — public read, owning promoter manages
CREATE POLICY "events_select_public" ON hush_events FOR SELECT USING (TRUE);
CREATE POLICY "events_promoter_manages" ON hush_events FOR ALL USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
) WITH CHECK (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- hush_keywords — public read for active keywords (so the SMS lookup works
-- via service role anyway, but lets clients verify keyword availability),
-- owning promoter manages
CREATE POLICY "keywords_select_active" ON hush_keywords FOR SELECT USING (is_active = TRUE OR promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid()));
CREATE POLICY "keywords_promoter_manages" ON hush_keywords FOR ALL USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
) WITH CHECK (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- hush_passes — guest sees own, promoter sees passes for own events.
-- Inserts happen via service role after Stripe checkout (bypass RLS).
-- Updates (check-in) happen via service role from door-scan endpoint.
CREATE POLICY "passes_select_guest_or_promoter" ON hush_passes FOR SELECT USING (
  auth.uid() = guest_id
  OR event_id IN (
    SELECT e.id FROM hush_events e
    JOIN hush_promoters p ON p.id = e.promoter_id
    WHERE p.user_id = auth.uid()
  )
);

-- hush_model_bookings — model sees own, promoter sees own bookings
-- Inserts/updates via service role (booking flow + payout).
CREATE POLICY "model_bookings_select_participant" ON hush_model_bookings FOR SELECT USING (
  model_id IN (SELECT id FROM hush_models WHERE user_id = auth.uid())
  OR promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- hush_streams — public read (it's a streaming feed), owning model manages
CREATE POLICY "streams_select_public" ON hush_streams FOR SELECT USING (TRUE);
CREATE POLICY "streams_model_manages" ON hush_streams FOR ALL USING (
  model_id IN (SELECT id FROM hush_models WHERE user_id = auth.uid())
) WITH CHECK (
  model_id IN (SELECT id FROM hush_models WHERE user_id = auth.uid())
);

-- hush_tips — sender sees own, recipient model sees own. Inserts via
-- service role (Stripe payment intent confirmation).
CREATE POLICY "tips_select_participant" ON hush_tips FOR SELECT USING (
  auth.uid() = from_user_id
  OR model_id IN (SELECT id FROM hush_models WHERE user_id = auth.uid())
);

-- hush_credits_ledger — owner reads own ledger. All writes via service
-- role (purchase webhooks, boost spend, etc.) — no client INSERT policy
-- by design so balances can't be inflated client-side.
CREATE POLICY "credits_ledger_select_own" ON hush_credits_ledger FOR SELECT USING (auth.uid() = user_id);

-- hush_boosts — owner reads/manages own active boosts.
CREATE POLICY "boosts_select_own" ON hush_boosts FOR SELECT USING (auth.uid() = user_id);

-- hush_posts — public feed; owner full control over own posts.
CREATE POLICY "posts_select_public_or_own" ON hush_posts FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "posts_insert_self" ON hush_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON hush_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON hush_posts FOR DELETE USING (auth.uid() = user_id);

-- hush_connections — either side can read; sender creates, either deletes.
CREATE POLICY "connections_select_either" ON hush_connections FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "connections_insert_self" ON hush_connections FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "connections_update_either" ON hush_connections FOR UPDATE USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "connections_delete_either" ON hush_connections FOR DELETE USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- hush_contacts — promoter-owned CRM, only owning promoter sees/manages.
CREATE POLICY "contacts_promoter_manages" ON hush_contacts FOR ALL USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
) WITH CHECK (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- hush_network — Mogul sees own network, child promoter sees their parent.
CREATE POLICY "network_select_participant" ON hush_network FOR SELECT USING (
  mogul_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
  OR promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);
CREATE POLICY "network_mogul_manages" ON hush_network FOR ALL USING (
  mogul_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
) WITH CHECK (
  mogul_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- hush_interviews — promoter and model see own interviews.
CREATE POLICY "interviews_select_participant" ON hush_interviews FOR SELECT USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
  OR model_id IN (SELECT id FROM hush_models WHERE user_id = auth.uid())
);
CREATE POLICY "interviews_promoter_manages" ON hush_interviews FOR ALL USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
) WITH CHECK (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hush_users
  SET credit_balance = credit_balance + NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_credit_ledger_insert
  AFTER INSERT ON hush_credits_ledger
  FOR EACH ROW EXECUTE FUNCTION update_credit_balance();

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hush_users_updated_at
  BEFORE UPDATE ON hush_users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
