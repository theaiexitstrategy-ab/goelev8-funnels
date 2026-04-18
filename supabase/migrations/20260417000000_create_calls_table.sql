-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Create the calls table used by the inbound toll-free routing system.
--
-- Status values:
--   ringing            — call arrived, Aaron's cell is being dialed
--   answered-by-aaron  — Aaron answered and stayed on the line
--   routed-to-vapi     — call handed to Vapi (either by Aaron pressing 1, or because Aaron didn't answer)
--   sms-sent           — Aaron pressed 2, or Vapi unavailable, so caller got an SMS text-back
--   missed             — nothing worked; caller got nothing (should be rare)

CREATE TABLE IF NOT EXISTS calls (
  id              bigserial PRIMARY KEY,
  call_sid        text UNIQUE,
  caller_number   text NOT NULL,
  client_slug     text NOT NULL DEFAULT 'goelev8',
  status          text NOT NULL DEFAULT 'ringing',
  duration        integer,
  text_back_sent  boolean NOT NULL DEFAULT false,
  vapi_used       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_sid       text;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS caller_number  text;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS client_slug    text DEFAULT 'goelev8';
ALTER TABLE calls ADD COLUMN IF NOT EXISTS status         text DEFAULT 'ringing';
ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration       integer;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS text_back_sent boolean DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS vapi_used      boolean DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calls_call_sid_key') THEN
    ALTER TABLE calls ADD CONSTRAINT calls_call_sid_key UNIQUE (call_sid);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calls_created_at   ON calls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_caller       ON calls (caller_number);
CREATE INDEX IF NOT EXISTS idx_calls_client_slug  ON calls (client_slug);
CREATE INDEX IF NOT EXISTS idx_calls_status       ON calls (status);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on calls" ON calls;
CREATE POLICY "Service role full access on calls"
  ON calls FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read calls" ON calls;
CREATE POLICY "Admin can read calls"
  ON calls FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');
