-- supabase/migrations/004_pg_cron.sql
-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.

-- SMS sequence scheduler — every 5 minutes
select cron.schedule('sms-scheduler','*/5 * * * *', $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sms-scheduler',
    headers := jsonb_build_object(
      'Authorization','Bearer ' || current_setting('app.service_role_key'),
      'Content-Type','application/json'),
    body := '{}'::jsonb);
$$);

-- 24-hour booking reminders — every hour
select cron.schedule('booking-reminders','0 * * * *', $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-booking-reminders',
    headers := jsonb_build_object(
      'Authorization','Bearer ' || current_setting('app.service_role_key'),
      'Content-Type','application/json'),
    body := '{}'::jsonb);
$$);

-- Cleanup chat sessions older than 90 days — daily 2am
select cron.schedule('cleanup-chat-sessions','0 2 * * *',
  $$delete from chat_sessions where created_at < now() - interval '90 days';$$);

-- Cleanup call transcripts older than 90 days — daily 3am
select cron.schedule('cleanup-transcripts','0 3 * * *',
  $$update leads set call_transcript = null
    where created_at < now() - interval '90 days' and call_transcript is not null;$$);

-- Purge demo leads older than 30 days — daily 4am
select cron.schedule('purge-demo-leads','0 4 * * *', $$
  delete from leads where source = 'demo' and created_at < now() - interval '30 days';
$$);
