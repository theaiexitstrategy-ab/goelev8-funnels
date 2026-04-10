-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Migration: Add columns to funnels for the prompt builder, create nudge_messages & build_rate_limits tables.

-- ═══════════════════════════════════════════════════
-- 1. Add prompt-builder columns to funnels table
-- ═══════════════════════════════════════════════════

ALTER TABLE funnels ADD COLUMN IF NOT EXISTS prompt_input text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS hero_headline text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS hero_subheadline text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS offer_text text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_1_title text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_1_body text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_2_title text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_2_body text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_3_title text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_3_body text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_4_title text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS feature_4_body text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS is_prospect boolean DEFAULT false;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id);
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Index for unclaimed funnel lookups and expiry checks
CREATE INDEX IF NOT EXISTS idx_funnels_is_claimed ON funnels(is_claimed) WHERE is_claimed = false;
CREATE INDEX IF NOT EXISTS idx_funnels_expires_at ON funnels(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funnels_slug ON funnels(slug);

-- ═══════════════════════════════════════════════════
-- 2. Create nudge_messages table (SMS sequences)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nudge_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id   uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  step        integer NOT NULL,             -- 1-5
  body        text NOT NULL,                -- SMS body (max 160 chars recommended)
  delay_label text,                         -- e.g. 'immediate', '1_hour', '24_hour', '48_hour', '72_hour'
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE nudge_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — used by API routes
-- Owners can read their own nudge messages
CREATE POLICY "nudge_messages_owner_read" ON nudge_messages
  FOR SELECT USING (
    funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid())
  );

CREATE INDEX idx_nudge_messages_funnel ON nudge_messages(funnel_id);

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

-- No RLS policies needed — only accessed via service role key
CREATE INDEX idx_build_rate_limits_ip ON build_rate_limits(ip_hash);
CREATE INDEX idx_build_rate_limits_window ON build_rate_limits(window_start);
