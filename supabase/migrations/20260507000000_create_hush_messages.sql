-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
--
-- SMS message log for the Hush shared inbound number. Every inbound
-- text from a guest and every AI reply is recorded here. The
-- promoter_id/keyword_id columns are nullable so unmatched keywords
-- still get logged (with no promoter) for debugging.

CREATE TABLE hush_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promoter_id UUID REFERENCES hush_promoters(id) ON DELETE SET NULL,
  keyword_id UUID REFERENCES hush_keywords(id) ON DELETE SET NULL,
  twilio_sid TEXT,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX hush_messages_promoter_recent
  ON hush_messages (promoter_id, created_at DESC);

CREATE INDEX hush_messages_keyword
  ON hush_messages (keyword_id);

ALTER TABLE hush_messages ENABLE ROW LEVEL SECURITY;

-- Owning promoter sees their own message log. Inbound traffic with no
-- match (promoter_id IS NULL) stays admin-only by RLS default.
CREATE POLICY "messages_select_own_promoter" ON hush_messages
  FOR SELECT USING (
    promoter_id IN (SELECT id FROM hush_promoters WHERE user_id = auth.uid())
  );

-- All inserts happen via service-role from the inbound webhook. No
-- client INSERT policy by design.
