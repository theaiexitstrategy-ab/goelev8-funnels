-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Alter existing vapi_calls table to add columns needed for Lev assistant logging.
-- Existing columns: id, client_id, caller_phone, duration_seconds, outcome, transcript, vapi_call_id, created_at

-- Add missing columns
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS call_id text;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS caller_number text;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS ended_reason text;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS assistant_id text;
ALTER TABLE vapi_calls ADD COLUMN IF NOT EXISTS recording_url text;

-- Backfill call_id from vapi_call_id where available
UPDATE vapi_calls SET call_id = vapi_call_id WHERE call_id IS NULL AND vapi_call_id IS NOT NULL;

-- Backfill caller_number from caller_phone where available
UPDATE vapi_calls SET caller_number = caller_phone WHERE caller_number IS NULL AND caller_phone IS NOT NULL;

-- Add unique constraint on call_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vapi_calls_call_id_key') THEN
    ALTER TABLE vapi_calls ADD CONSTRAINT vapi_calls_call_id_key UNIQUE (call_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE vapi_calls ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before recreating
DROP POLICY IF EXISTS "Admin can read vapi_calls" ON vapi_calls;
DROP POLICY IF EXISTS "Service role can insert vapi_calls" ON vapi_calls;
DROP POLICY IF EXISTS "Service role can update vapi_calls" ON vapi_calls;

-- Only allow reads for authenticated admin users (ab@goelev8.ai)
CREATE POLICY "Admin can read vapi_calls"
  ON vapi_calls FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');

-- Service role can insert (webhook uses service role key)
CREATE POLICY "Service role can insert vapi_calls"
  ON vapi_calls FOR INSERT TO service_role
  WITH CHECK (true);

-- Service role can update (for upserts)
CREATE POLICY "Service role can update vapi_calls"
  ON vapi_calls FOR UPDATE TO service_role
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vapi_calls_created_at ON vapi_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vapi_calls_call_id ON vapi_calls (call_id);
