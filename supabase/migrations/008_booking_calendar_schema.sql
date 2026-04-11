-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Migration: Booking calendar schema + seed data for Daniels Legacy Planning.
--
-- Notes:
--  * business_id is a free-form uuid (no FK) because the "businesses" table
--    does not exist in this schema — each client is currently represented by
--    a row in the funnels table. Wire up the FK when a canonical businesses
--    table lands.
--  * booking_appointments is locked down at the row level (no public read).
--    Public slot-blocking reads go through the booking_appointments_public
--    view, which exposes ONLY calendar_id + start/end — no lead PII.

-- ═══════════════════════════════════════════════════
-- 1. Tables
-- ═══════════════════════════════════════════════════

create table if not exists booking_calendars (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  business_id          uuid,
  title                text not null,
  timezone             text not null default 'America/Chicago',
  booking_window_days  int  not null default 30,
  min_notice_hours     int  not null default 2,
  custom_domain        text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table if not exists booking_services (
  id               uuid primary key default gen_random_uuid(),
  calendar_id      uuid not null references booking_calendars(id) on delete cascade,
  name             text not null,
  duration_minutes int  not null,
  description      text,
  price_cents      int  not null default 0,
  is_active        boolean not null default true
);

create table if not exists booking_availability (
  id          uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references booking_calendars(id) on delete cascade,
  day_of_week int  not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null
);

create table if not exists booking_appointments (
  id                     uuid primary key default gen_random_uuid(),
  calendar_id            uuid not null references booking_calendars(id) on delete cascade,
  service_id             uuid not null references booking_services(id),
  lead_name              text not null,
  lead_email             text not null,
  lead_phone             text not null,
  appointment_start      timestamptz not null,
  appointment_end        timestamptz not null,
  status                 text not null default 'pending'
                         check (status in ('pending','confirmed','cancelled','no_show')),
  notes                  text,
  confirmation_sms_sent  boolean not null default false,
  reminder_sms_sent      boolean not null default false,
  created_at             timestamptz not null default now()
);

-- Defensive: if an earlier partial run created booking_calendars with
-- business_id NOT NULL (referencing a non-existent businesses table),
-- drop the constraint so the seed and future inserts can omit it.
alter table booking_calendars alter column business_id drop not null;

create index if not exists idx_booking_calendars_custom_domain
  on booking_calendars(custom_domain) where custom_domain is not null;
create index if not exists idx_booking_services_calendar
  on booking_services(calendar_id);
create index if not exists idx_booking_availability_calendar_day
  on booking_availability(calendar_id, day_of_week);
create index if not exists idx_booking_appointments_calendar_start
  on booking_appointments(calendar_id, appointment_start);

-- ═══════════════════════════════════════════════════
-- 2. PII-safe view for public slot blocking
-- ═══════════════════════════════════════════════════
-- Exposes only the columns the booking UI needs to compute availability.
-- Cancelled appointments are excluded so cancelled slots re-open.

create or replace view booking_appointments_public as
  select
    calendar_id,
    appointment_start,
    appointment_end
  from booking_appointments
  where status <> 'cancelled';

grant select on booking_appointments_public to anon, authenticated;

-- ═══════════════════════════════════════════════════
-- 3. Row Level Security
-- ═══════════════════════════════════════════════════

alter table booking_calendars    enable row level security;
alter table booking_services     enable row level security;
alter table booking_availability enable row level security;
alter table booking_appointments enable row level security;

drop policy if exists booking_calendars_public_select    on booking_calendars;
drop policy if exists booking_services_public_select     on booking_services;
drop policy if exists booking_availability_public_select on booking_availability;
drop policy if exists booking_appointments_public_select on booking_appointments;
drop policy if exists booking_appointments_public_insert on booking_appointments;

-- Public can read active calendars
create policy booking_calendars_public_select on booking_calendars
  for select
  using (is_active = true);

-- Public can read active services belonging to active calendars
create policy booking_services_public_select on booking_services
  for select
  using (
    is_active = true
    and exists (
      select 1 from booking_calendars c
      where c.id = booking_services.calendar_id and c.is_active = true
    )
  );

-- Public can read availability for active calendars
create policy booking_availability_public_select on booking_availability
  for select
  using (
    exists (
      select 1 from booking_calendars c
      where c.id = booking_availability.calendar_id and c.is_active = true
    )
  );

-- booking_appointments has NO public SELECT policy — PII is protected.
-- The server-side booking page reads through the service-role key, and
-- any anon slot-blocking read must go through booking_appointments_public.

-- Public can insert new appointments against active calendars.
-- (Inserts are also rate-limited and validated server-side in /api/bookings,
-- which runs with the service role and bypasses RLS, but this policy keeps
-- the direct anon path usable if ever needed.)
create policy booking_appointments_public_insert on booking_appointments
  for insert
  with check (
    exists (
      select 1 from booking_calendars c
      where c.id = booking_appointments.calendar_id and c.is_active = true
    )
  );

-- ═══════════════════════════════════════════════════
-- 4. Seed: Daniels Legacy Planning demo calendar
-- ═══════════════════════════════════════════════════

do $$
declare
  v_calendar_id uuid;
begin
  select id into v_calendar_id
    from booking_calendars
    where slug = 'daniels-legacy-planning';

  if v_calendar_id is null then
    insert into booking_calendars (
      slug, business_id, title, timezone,
      booking_window_days, min_notice_hours,
      custom_domain, is_active
    ) values (
      'daniels-legacy-planning',
      null,
      'Daniels Legacy Planning',
      'America/Chicago',
      30,
      2,
      'book.danielslegacyplanning.com',
      true
    )
    returning id into v_calendar_id;

    insert into booking_services (
      calendar_id, name, duration_minutes, description, price_cents, is_active
    ) values (
      v_calendar_id,
      'Free Legacy Consultation',
      30,
      'A 30-minute introductory consultation to discuss your legacy planning goals.',
      0,
      true
    );

    insert into booking_availability (calendar_id, day_of_week, start_time, end_time)
    select v_calendar_id, d, '09:00'::time, '17:00'::time
    from unnest(array[1,2,3,4,5]) as d;
  end if;
end $$;
