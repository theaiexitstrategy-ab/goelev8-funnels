-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Capture hero-section demo leads (SMS demo + Vapi call demo).

CREATE TABLE IF NOT EXISTS demo_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  industry text,
  phone_number text NOT NULL,
  generated_script text,
  sms_sent boolean DEFAULT false,
  sms_sent_at timestamptz,
  vapi_call boolean DEFAULT false,
  vapi_call_id text,
  source text NOT NULL CHECK (source IN ('hero', 'vapi-strip')),
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read demo_leads" ON demo_leads;
DROP POLICY IF EXISTS "Service role can insert demo_leads" ON demo_leads;
DROP POLICY IF EXISTS "Service role can update demo_leads" ON demo_leads;

CREATE POLICY "Admin can read demo_leads"
  ON demo_leads FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ab@goelev8.ai');

CREATE POLICY "Service role can insert demo_leads"
  ON demo_leads FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update demo_leads"
  ON demo_leads FOR UPDATE TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON demo_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_phone ON demo_leads (phone_number);
