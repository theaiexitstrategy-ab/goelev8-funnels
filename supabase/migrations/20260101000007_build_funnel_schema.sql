-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Migration: Create funnels table (full schema), nudge_messages & build_rate_limits tables.

-- ═══════════════════════════════════════════════════
-- 1. Create funnels table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS funnels (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id),
  slug                  text NOT NULL,
  name                  text,
  accent_color          text DEFAULT '#00CFFF',
  is_active             boolean DEFAULT true,

  -- Prompt builder content
  prompt_input          text,
  hero_headline         text,
  hero_subheadline      text,
  offer_text            text,
  cta_text              text,
  feature_1_title       text,
  feature_1_body        text,
  feature_2_title       text,
  feature_2_body        text,
  feature_3_title       text,
  feature_3_body        text,
  feature_4_title       text,
  feature_4_body        text,
  industry              text,
  city                  text,

  -- Claiming / ownership
  is_claimed            boolean DEFAULT false,
  is_prospect           boolean DEFAULT false,
  claimed_by            uuid REFERENCES auth.users(id),
  client_id             uuid,
  expires_at            timestamptz,

  -- Custom domain
  custom_domain         text,
  domain_status         text DEFAULT 'none',

  -- Site connect
  site_connect_url      text,
  site_connect_platform text,
  site_connect_token    text,
  site_connected_at     timestamptz,

  created_at            timestamptz DEFAULT now()
);

ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their own funnels
CREATE POLICY "funnels_owner_all" ON funnels
  FOR ALL USING (user_id = auth.uid());

-- Public can read active funnels by slug (for /f/[slug] pages)
CREATE POLICY "funnels_public_read" ON funnels
  FOR SELECT USING (is_active = true);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_funnels_slug ON funnels(slug);
CREATE INDEX IF NOT EXISTS idx_funnels_user ON funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_funnels_is_claimed ON funnels(is_claimed) WHERE is_claimed = false;
CREATE INDEX IF NOT EXISTS idx_funnels_expires_at ON funnels(expires_at) WHERE expires_at IS NOT NULL;

-- ═══════════════════════════════════════════════════
-- 2. Create nudge_messages table (SMS sequences)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nudge_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id   uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step        integer NOT NULL,
  body        text NOT NULL,
  delay_label text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE nudge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nudge_messages_owner_read" ON nudge_messages
  FOR SELECT USING (
    funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_nudge_messages_funnel ON nudge_messages(funnel_id);

-- ═══════════════════════════════════════════════════
-- 3. Create build_rate_limits table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS build_rate_limits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash       text NOT NULL,
  count         integer NOT NULL DEFAULT 1,
  window_start  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE build_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_build_rate_limits_ip ON build_rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_build_rate_limits_window ON build_rate_limits(window_start);
