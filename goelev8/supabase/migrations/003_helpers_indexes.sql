-- supabase/migrations/003_helpers_indexes.sql
-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

-- Atomic SMS credit deduction (prevents race conditions on concurrent sends)
create or replace function deduct_sms_credit(p_user_id uuid)
returns boolean language plpgsql as $$
begin
  update users set sms_credits = sms_credits - 1
  where id = p_user_id and sms_credits > 0;
  return found;
end;
$$;

-- Bulk deduct for blast campaigns
create or replace function deduct_sms_credits(p_user_id uuid, p_count integer)
returns boolean language plpgsql as $$
begin
  update users set sms_credits = sms_credits - p_count
  where id = p_user_id and sms_credits >= p_count;
  return found;
end;
$$;

-- Add SMS credits atomically
create or replace function add_sms_credits(p_user_id uuid, p_credits integer)
returns void language plpgsql as $$
begin
  update users set sms_credits = sms_credits + p_credits where id = p_user_id;
end;
$$;

-- Performance indexes
create index idx_leads_funnel_id on leads(funnel_id);
create index idx_leads_status on leads(status);
create index idx_leads_next_sms on leads(next_sms_at) where status = 'sms_sequence';
create index idx_leads_phone on leads(phone);
create index idx_sms_log_lead_id on sms_log(lead_id);
create index idx_funnels_slug on funnels(slug);
create index idx_funnels_user_id on funnels(user_id);
create index idx_blasts_user_id on sms_blasts(user_id);
create index idx_product_sales_seller on product_sales(seller_user_id);
create index idx_chat_sessions_funnel on chat_sessions(funnel_id);
create index idx_analytics_funnel on funnel_analytics(funnel_id);
