-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Global SMS suppression list. One row per opted-out phone. Every outbound
-- SMS path checks this table before sending so STOP on one number suppresses
-- ALL traffic to that phone across uplift, call text-backs, and nudges.

create table if not exists sms_opt_outs (
  phone            text primary key,                              -- E.164 as Twilio sends it
  opted_out_at     timestamptz not null default now(),
  source           text,                                          -- which route logged the STOP
  message_received text
);

create index if not exists idx_sms_opt_outs_opted_out_at
  on sms_opt_outs (opted_out_at desc);

alter table sms_opt_outs enable row level security;

drop policy if exists "Service role full access on sms_opt_outs" on sms_opt_outs;
create policy "Service role full access on sms_opt_outs"
  on sms_opt_outs for all to service_role
  using (true) with check (true);

drop policy if exists "Admin can read sms_opt_outs" on sms_opt_outs;
create policy "Admin can read sms_opt_outs"
  on sms_opt_outs for select to authenticated
  using (auth.jwt() ->> 'email' = 'ab@goelev8.ai');
