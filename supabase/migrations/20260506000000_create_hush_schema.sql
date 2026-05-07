-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
--
-- Hush AI schema — users, profiles, promoters, models, events, keywords,
-- passes, bookings, streams, tips, credits ledger, boosts, posts,
-- connections, CRM contacts, network, video interviews.
--
-- NOTE: RLS is enabled on all tables but several lack INSERT/UPDATE policies
-- (hush_promoters, hush_models, hush_keywords, hush_passes, hush_connections,
-- hush_contacts, hush_network) — those tables will reject all writes until
-- policies are added. The credits trigger will not fire until an INSERT
-- policy exists on hush_credits_ledger. Add policies before any user-facing
-- write path goes live. See task list in the project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (extends Supabase auth.users)
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

-- RLS POLICIES
ALTER TABLE hush_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hush_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own data" ON hush_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own data" ON hush_users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles readable" ON hush_profiles FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Owner updates profile" ON hush_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Credits owner only" ON hush_credits_ledger FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Events public read" ON hush_events FOR SELECT USING (TRUE);
CREATE POLICY "Promoter manages events" ON hush_events FOR ALL USING (
  promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
);

CREATE POLICY "Public posts" ON hush_posts FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users post" ON hush_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FUNCTIONS & TRIGGERS
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
