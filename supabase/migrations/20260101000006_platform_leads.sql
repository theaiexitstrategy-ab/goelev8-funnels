-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

create table platform_leads (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text,
  email               text,
  phone               text not null,
  source              text default 'homepage'
    check (source in ('homepage','pricing','powered_by','demo','referral')),
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  page_url            text,
  status              text default 'new'
    check (status in ('new','sms_sent','signed_up','dead')),
  converted_user_id   uuid references users(id),
  sms_sent_at         timestamptz,
  signed_up_at        timestamptz,
  created_at          timestamptz default now()
);

alter table platform_leads enable row level security;

-- Admin only — Aaron's email checked at query time
create policy "platform_leads_admin_only" on platform_leads
  for all using (
    auth.uid() in (
      select id from users
      where email = current_setting('app.admin_email', true)
    )
  );

-- Service role bypasses RLS — used by API route and edge function
-- No additional policy needed for service role

-- Index for duplicate phone check
create index idx_platform_leads_phone on platform_leads(phone);
create index idx_platform_leads_status on platform_leads(status);
create index idx_platform_leads_created on platform_leads(created_at desc);
