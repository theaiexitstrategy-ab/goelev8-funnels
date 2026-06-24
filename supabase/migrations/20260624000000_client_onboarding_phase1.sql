-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Client onboarding Phase 1: extend clients with onboarding state +
-- create client_info / client_assets tables + storage bucket.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS email                  text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan                   text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS paid_at                timestamptz;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_status      text NOT NULL DEFAULT 'pending';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_step        int  NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS resume_token           uuid DEFAULT gen_random_uuid();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_config_slug text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_resume_token ON clients (resume_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_stripe_session ON clients (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_onboarding_status_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_onboarding_status_check
  CHECK (onboarding_status IN ('pending','started','in_progress','complete'));

CREATE TABLE IF NOT EXISTS client_info (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  business_name       text,
  tagline             text,
  phone               text,
  address             text,
  city                text,
  state               text,
  zip                 text,
  booking_url         text,
  social_instagram    text,
  social_facebook     text,
  social_tiktok       text,
  primary_color       text,
  secondary_color     text,
  font_preference     text,
  brand_notes         text,
  services            jsonb NOT NULL DEFAULT '[]'::jsonb,
  domain_preference   text,
  keywords            text[] NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_info_client ON client_info (client_id);

CREATE TABLE IF NOT EXISTS client_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_url      text NOT NULL,
  file_type     text NOT NULL CHECK (file_type IN ('image','video')),
  label         text,
  page_position text CHECK (page_position IN ('hero','about','services','gallery')),
  rank          int  NOT NULL DEFAULT 0,
  size_bytes    bigint,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_assets_client_position_rank
  ON client_assets (client_id, page_position, rank);

ALTER TABLE client_info   ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on client_info" ON client_info;
CREATE POLICY "Service role full access on client_info"
  ON client_info FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on client_assets" ON client_assets;
CREATE POLICY "Service role full access on client_assets"
  ON client_assets FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read client_info" ON client_info;
CREATE POLICY "Admin can read client_info"
  ON client_info FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');

DROP POLICY IF EXISTS "Admin can read client_assets" ON client_assets;
CREATE POLICY "Admin can read client_assets"
  ON client_assets FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');

INSERT INTO storage.buckets (id, name, public)
  VALUES ('client-assets', 'client-assets', true)
  ON CONFLICT (id) DO NOTHING;
