-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Three-day nudge schedule for the SMS Uplift assistant. When someone texts
-- their keyword in, we schedule three rows here (one per day). A daily cron
-- queries for due_at <= now() AND sent_at IS NULL, generates a fresh message
-- via Claude, sends it via Twilio, and stamps sent_at + message + twilio_sid.

create table if not exists sms_uplift_nudges (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  profile_key  text not null,
  day_number   int  not null check (day_number in (1, 2, 3)),
  due_at       timestamptz not null,
  sent_at      timestamptz,
  message      text,
  twilio_sid   text,
  error        text,
  created_at   timestamptz not null default now()
);

-- One row per (phone, profile, day) — re-opting-in is a no-op.
create unique index if not exists idx_uplift_nudges_unique
  on sms_uplift_nudges (phone, profile_key, day_number);

-- Hot path for the cron: pending nudges sorted by when they're due.
create index if not exists idx_uplift_nudges_due_pending
  on sms_uplift_nudges (due_at) where sent_at is null;

alter table sms_uplift_nudges enable row level security;

drop policy if exists "Service role full access on sms_uplift_nudges" on sms_uplift_nudges;
create policy "Service role full access on sms_uplift_nudges"
  on sms_uplift_nudges for all to service_role
  using (true) with check (true);

drop policy if exists "Admin can read sms_uplift_nudges" on sms_uplift_nudges;
create policy "Admin can read sms_uplift_nudges"
  on sms_uplift_nudges for select to authenticated
  using (auth.jwt() ->> 'email' = 'ab@goelev8.ai');
