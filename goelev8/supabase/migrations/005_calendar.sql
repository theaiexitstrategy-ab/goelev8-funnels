-- supabase/migrations/005_calendar.sql
-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

create table availability (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  funnel_id   uuid references funnels(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  timezone    text not null default 'America/Chicago',
  is_active   boolean default true
);

create table booked_slots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  funnel_id         uuid references funnels(id) on delete cascade,
  lead_id           uuid references leads(id) on delete cascade,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  duration_mins     integer default 30,
  status            text default 'confirmed'
    check (status in ('confirmed','cancelled','no_show','completed','rescheduled')),
  confirmation_code text unique default upper(substring(gen_random_uuid()::text,1,8)),
  notes             text,
  calendar_event_id text,
  calendar_platform text,
  reminder_sent     boolean default false,
  created_at        timestamptz default now()
);

create table calendar_integrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references users(id) on delete cascade,
  platform         text not null
    check (platform in ('google','calendly','acuity','outlook')),
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  calendar_id      text,
  redirect_url     text,
  is_primary       boolean default false,
  created_at       timestamptz default now()
);

-- RLS
alter table availability enable row level security;
alter table booked_slots enable row level security;
alter table calendar_integrations enable row level security;

create policy "avail_own" on availability for all using (auth.uid() = user_id);
create policy "avail_public_read" on availability for select using (is_active = true);
create policy "slots_own" on booked_slots for all using (auth.uid() = user_id);
create policy "slots_public_insert" on booked_slots for insert with check (true);
create policy "cal_integrations_own" on calendar_integrations for all using (auth.uid() = user_id);

-- Indexes
create index idx_booked_slots_funnel on booked_slots(funnel_id);
create index idx_booked_slots_start on booked_slots(start_at);
create index idx_availability_user on availability(user_id);
