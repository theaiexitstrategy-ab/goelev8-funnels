-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Phase 1 of the AIES → portal integration.
--   funnel_subscribers — per-tenant newsletter audience (kept separate from
--                         platform_leads, which is GoElev8's own marketing list)
--   funnel_api_keys    — server-side bearer tokens that let an external site
--                         (e.g. theaiexitstrategy.com) POST signups into one
--                         specific funnel

-- ═══════════════════════════════════════════════════
-- 1. funnel_subscribers
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS funnel_subscribers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id           uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  email               text NOT NULL,
  phone               text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token  text UNIQUE DEFAULT gen_random_uuid()::text,
  confirmed_at        timestamptz,
  unsubscribed_at     timestamptz,
  sms_opt_in          boolean NOT NULL DEFAULT false,
  source              text DEFAULT 'website_popup',
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (funnel_id, email)
);

ALTER TABLE funnel_subscribers ENABLE ROW LEVEL SECURITY;

-- Funnel owner can read/manage their own subscriber list
CREATE POLICY "funnel_subscribers_owner_all" ON funnel_subscribers
  FOR ALL USING (
    funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid())
  );

-- Service role bypasses RLS — used by /api/external/funnel-subscribe and
-- by the (Phase 2+) edge functions

CREATE INDEX idx_funnel_subscribers_funnel  ON funnel_subscribers(funnel_id);
CREATE INDEX idx_funnel_subscribers_status  ON funnel_subscribers(funnel_id, status);
CREATE INDEX idx_funnel_subscribers_token   ON funnel_subscribers(confirmation_token);

-- updated_at trigger
CREATE OR REPLACE FUNCTION funnel_subscribers_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_funnel_subscribers_updated_at
  BEFORE UPDATE ON funnel_subscribers
  FOR EACH ROW EXECUTE FUNCTION funnel_subscribers_set_updated_at();

-- ═══════════════════════════════════════════════════
-- 2. funnel_api_keys
-- ═══════════════════════════════════════════════════
-- Only the sha256 of the raw key is stored — a DB leak does not grant write
-- access to subscriber lists. The raw key is shown to the user once, at
-- creation time, then never again.

CREATE TABLE IF NOT EXISTS funnel_api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id       uuid NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name            text NOT NULL,         -- human label, e.g. "theaiexitstrategy.com"
  key_hash        text NOT NULL UNIQUE,  -- sha256(raw_key) hex
  key_prefix      text NOT NULL,         -- first 8 chars of raw key, for display
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz
);

ALTER TABLE funnel_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_api_keys_owner_all" ON funnel_api_keys
  FOR ALL USING (
    funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid())
  );

CREATE INDEX idx_funnel_api_keys_funnel ON funnel_api_keys(funnel_id);
CREATE INDEX idx_funnel_api_keys_lookup ON funnel_api_keys(key_hash)
  WHERE revoked_at IS NULL;

-- ═══════════════════════════════════════════════════
-- Manual setup steps after applying this migration
-- ═══════════════════════════════════════════════════
--
-- 1. Ensure a funnels row exists for theaiexitstrategy.com. If none exists
--    yet, create one. user_id should be your portal user id (from auth.users).
--
--      INSERT INTO funnels (user_id, slug, name, custom_domain, is_active)
--      VALUES (
--        '<your-auth-user-id>',
--        'aies',
--        'The AI Exit Strategy',
--        'theaiexitstrategy.com',
--        true
--      )
--      RETURNING id;
--
-- 2. Generate an API key in a Node REPL on your laptop:
--
--      node -e "const c=require('crypto');const k=c.randomBytes(32).toString('base64url');console.log('KEY:',k);console.log('HASH:',c.createHash('sha256').update(k).digest('hex'));console.log('PREFIX:',k.slice(0,8));"
--
--    Insert the hash + prefix (NOT the raw key) into funnel_api_keys:
--
--      INSERT INTO funnel_api_keys (funnel_id, name, key_hash, key_prefix)
--      VALUES (
--        '<funnel_id_from_step_1>',
--        'theaiexitstrategy.com',
--        '<HASH>',
--        '<PREFIX>'
--      );
--
--    Save the raw KEY value as PORTAL_API_KEY in the AIES Vercel project's
--    Production environment variables. You will not be able to retrieve it
--    again — only its hash is stored.
