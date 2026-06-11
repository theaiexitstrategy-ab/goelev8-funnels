-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- DEMO keyword 4-message sequence + missed-call SMS fallback support.

-- ── PART 1: extend demo_leads with sequence state columns ──
-- Existing rows (single-shot demo attempts from /api/demo/{send-sms,trigger-call})
-- naturally have step_completed=0 and completed_at=null and are harmless.

ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS step_completed   int  NOT NULL DEFAULT 0;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS next_msg_due_at  timestamptz;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS yes_received_at  timestamptz;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS completed_at     timestamptz;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS superseded_at    timestamptz;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS keyword          text;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS gym_name         text;

-- Allow 'demo-keyword' as a source value (drop + recreate CHECK).
ALTER TABLE demo_leads DROP CONSTRAINT IF EXISTS demo_leads_source_check;
ALTER TABLE demo_leads
  ADD CONSTRAINT demo_leads_source_check
  CHECK (source IN ('hero', 'vapi-strip', 'demo-keyword'));

-- Cron hot path: due rows in an in-progress sequence.
CREATE INDEX IF NOT EXISTS idx_demo_leads_sequence_due
  ON demo_leads (next_msg_due_at)
  WHERE next_msg_due_at IS NOT NULL
    AND completed_at  IS NULL
    AND superseded_at IS NULL;

-- ── PART 2: missed_calls table ──

CREATE TABLE IF NOT EXISTS missed_calls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  call_sid    text,
  call_status text,
  sms_sent    boolean NOT NULL DEFAULT false,
  sms_sid     text,
  sms_error   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missed_calls_phone   ON missed_calls (phone);
CREATE INDEX IF NOT EXISTS idx_missed_calls_created ON missed_calls (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_missed_calls_sid_unique
  ON missed_calls (call_sid) WHERE call_sid IS NOT NULL;

ALTER TABLE missed_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on missed_calls" ON missed_calls;
CREATE POLICY "Service role full access on missed_calls"
  ON missed_calls FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read missed_calls" ON missed_calls;
CREATE POLICY "Admin can read missed_calls"
  ON missed_calls FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');
