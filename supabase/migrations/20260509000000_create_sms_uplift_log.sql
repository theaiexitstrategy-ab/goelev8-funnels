-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- SMS Uplift Assistant — log every inbound text + the message we sent back.

create table if not exists sms_uplift_log (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null,
  name_received   text,
  matched         boolean not null default false,
  matched_profile text,
  message_sent    text,
  rate_limited    boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sms_uplift_log_phone_created
  on sms_uplift_log (phone, created_at desc);

create index if not exists idx_sms_uplift_log_created
  on sms_uplift_log (created_at desc);

alter table sms_uplift_log enable row level security;

drop policy if exists "Service role full access on sms_uplift_log" on sms_uplift_log;
create policy "Service role full access on sms_uplift_log"
  on sms_uplift_log for all to service_role
  using (true) with check (true);

drop policy if exists "Admin can read sms_uplift_log" on sms_uplift_log;
create policy "Admin can read sms_uplift_log"
  on sms_uplift_log for select to authenticated
  using (auth.jwt() ->> 'email' = 'ab@goelev8.ai');
