-- supabase/migrations/001_core_tables.sql
-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

create table users (
  id                        uuid primary key default gen_random_uuid(),
  email                     text unique not null,
  full_name                 text,
  phone                     text,
  stripe_customer_id        text unique,
  stripe_connect_account_id text,
  tier                      text default 'trial'
    check (tier in ('trial','launch','grow','scale','cancelled')),
  trial_ends_at             timestamptz default now() + interval '7 days',
  subscribed_at             timestamptz,
  cancelled_at              timestamptz,
  sms_credits               integer default 0,
  a2p_status                text default 'pending'
    check (a2p_status in ('pending','submitted','approved','failed')),
  a2p_brand_sid             text,
  a2p_campaign_sid          text,
  is_demo                   boolean default false,
  demo_vertical             text,
  demo_label                text,
  demo_slug                 text,
  created_at                timestamptz default now()
);

create table funnels (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references users(id) on delete cascade,
  slug                  text unique not null,
  business_name         text,
  industry              text,
  owner_name            text,
  location              text,
  phone                 text,
  specialty             text,
  offer                 text,
  headline              text,
  subheadline           text,
  cta_text              text,
  accent_color          text default '#00CFFF',
  template_key          text default 'fitness',
  trust_bullet_1        text,
  trust_bullet_2        text,
  trust_bullet_3        text,
  sms_day0              text,
  sms_day1              text,
  sms_day3              text,
  sms_day7              text,
  sms_day14             text,
  agent_opening         text,
  agent_script          text,
  agent_knowledgebase   text,
  vapi_assistant_id     text,
  twilio_number         text,
  twilio_number_sid     text,
  toll_free_verified    boolean default false,
  page_url              text,
  site_connect_url      text,
  site_connect_platform text,
  site_connect_token    text,
  site_connected_at     timestamptz,
  ai_agent_enabled      boolean default false,
  chat_widget_enabled   boolean default true,
  sms_enabled           boolean default true,
  store_enabled         boolean default false,
  custom_domain         text,
  domain_status         text default 'none'
    check (domain_status in ('none','pending','active','failed')),
  prompt                text,
  is_active             boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table leads (
  id                    uuid primary key default gen_random_uuid(),
  funnel_id             uuid references funnels(id) on delete cascade,
  user_id               uuid references users(id) on delete cascade,
  full_name             text,
  phone                 text not null,
  email                 text,
  goal                  text,
  source                text default 'funnel'
    check (source in ('funnel','chat_widget','site_connect','sms_blast','manual','demo')),
  status                text default 'new'
    check (status in ('new','called','no_answer','sms_sequence','booked','purchased','dead')),
  sms_step              integer default 0,
  next_sms_at           timestamptz,
  vapi_call_id          text,
  call_outcome          text,
  call_duration_seconds integer,
  call_transcript       text,
  booked_at             timestamptz,
  created_at            timestamptz default now()
);

create table sms_log (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references leads(id) on delete cascade,
  funnel_id    uuid references funnels(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  direction    text check (direction in ('outbound','inbound')),
  body         text not null,
  twilio_sid   text,
  status       text default 'queued',
  credits_used integer default 1,
  step         integer,
  blast_id     uuid,
  sent_at      timestamptz default now()
);

create table sms_credits_log (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references users(id) on delete cascade,
  credits_added            integer not null,
  amount_usd               numeric not null,
  rate_per_credit          numeric not null,
  stripe_payment_intent_id text,
  created_at               timestamptz default now()
);

create table sms_blasts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  funnel_id       uuid references funnels(id) on delete cascade,
  name            text,
  prompt          text,
  body            text not null,
  segment         text default 'all',
  recipient_count integer default 0,
  sent_count      integer default 0,
  credits_used    integer default 0,
  status          text default 'draft'
    check (status in ('draft','scheduled','sending','sent','failed')),
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz default now()
);

create table bookings (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid references leads(id) on delete cascade,
  funnel_id         uuid references funnels(id) on delete cascade,
  user_id           uuid references users(id) on delete cascade,
  booked_at         timestamptz,
  calendar_event_id text,
  status            text default 'confirmed'
    check (status in ('confirmed','cancelled','no_show','completed','rescheduled')),
  created_at        timestamptz default now()
);

create table products (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  name              text not null,
  description       text,
  price_cents       integer not null,
  category          text check (category in ('physical','digital','service')),
  icon              text,
  image_url         text,
  external_url      text,
  stripe_price_id   text,
  stripe_product_id text,
  platform          text default 'native'
    check (platform in ('native','shopify','squarespace','wix','woocommerce','bigcommerce','custom')),
  is_active         boolean default true,
  total_sold        integer default 0,
  created_at        timestamptz default now()
);

create table product_sales (
  id                       uuid primary key default gen_random_uuid(),
  product_id               uuid references products(id) on delete cascade,
  seller_user_id           uuid references users(id) on delete cascade,
  lead_id                  uuid references leads(id),
  funnel_id                uuid references funnels(id),
  amount_cents             integer not null,
  platform_cut_cents       integer not null,
  seller_cut_cents         integer not null,
  stripe_payment_intent_id text,
  stripe_transfer_id       text,
  source                   text check (source in ('funnel','sms_blast','ai_call','direct')),
  created_at               timestamptz default now()
);

create table store_integrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  platform        text not null
    check (platform in ('shopify','squarespace','wix','woocommerce','bigcommerce')),
  access_token    text,
  store_url       text,
  store_hash      text,
  consumer_key    text,
  consumer_secret text,
  product_count   integer default 0,
  last_sync_at    timestamptz,
  status          text default 'active'
    check (status in ('active','disconnected','error')),
  created_at      timestamptz default now()
);

create table chat_sessions (
  id            uuid primary key default gen_random_uuid(),
  funnel_id     uuid references funnels(id) on delete cascade,
  lead_id       uuid references leads(id),
  session_token text unique default gen_random_uuid()::text,
  messages      jsonb default '[]'::jsonb,
  lead_captured boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table funnel_analytics (
  id         uuid primary key default gen_random_uuid(),
  funnel_id  uuid references funnels(id) on delete cascade,
  user_id    uuid references users(id) on delete cascade,
  event_type text not null,
  metadata   jsonb,
  created_at timestamptz default now()
);
