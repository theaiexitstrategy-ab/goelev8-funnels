-- supabase/migrations/002_rls_policies.sql
-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

alter table users enable row level security;
alter table funnels enable row level security;
alter table leads enable row level security;
alter table sms_log enable row level security;
alter table sms_credits_log enable row level security;
alter table sms_blasts enable row level security;
alter table bookings enable row level security;
alter table products enable row level security;
alter table product_sales enable row level security;
alter table store_integrations enable row level security;
alter table chat_sessions enable row level security;
alter table funnel_analytics enable row level security;

-- Users: own row only
create policy "users_own" on users for all using (auth.uid() = id);

-- Funnels: own + public read for active
create policy "funnels_own" on funnels for all using (auth.uid() = user_id);
create policy "funnels_public_read" on funnels for select using (is_active = true);

-- Leads: own + public insert (leads submit forms)
create policy "leads_own" on leads for all using (auth.uid() = user_id);
create policy "leads_public_insert" on leads for insert with check (true);

-- SMS Log: own only
create policy "sms_log_own" on sms_log for all using (auth.uid() = user_id);

-- SMS Credits Log: own only
create policy "credits_own" on sms_credits_log for all using (auth.uid() = user_id);

-- SMS Blasts: own only
create policy "blasts_own" on sms_blasts for all using (auth.uid() = user_id);

-- Bookings: own only
create policy "bookings_own" on bookings for all using (auth.uid() = user_id);

-- Products: own + public read active
create policy "products_own" on products for all using (auth.uid() = user_id);
create policy "products_public_read" on products for select using (is_active = true);

-- Product Sales: own only
create policy "sales_own" on product_sales for all using (auth.uid() = seller_user_id);

-- Store Integrations: own only
create policy "integrations_own" on store_integrations for all using (auth.uid() = user_id);

-- Chat Sessions: public insert + own read
create policy "chat_insert_public" on chat_sessions for insert with check (true);
create policy "chat_own_read" on chat_sessions for select
  using (funnel_id in (select id from funnels where user_id = auth.uid()));

-- Analytics: public insert + own read
create policy "analytics_insert" on funnel_analytics for insert with check (true);
create policy "analytics_own_read" on funnel_analytics for select using (auth.uid() = user_id);

-- VERIFY (must return 0 rows):
-- SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;
