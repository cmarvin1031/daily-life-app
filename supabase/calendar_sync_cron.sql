-- Schedules the sync-google-calendar Edge Function. Run in the Supabase SQL
-- editor AFTER the function is deployed and its secrets are set (README.md,
-- "Google Calendar sync").
--
-- Before running, replace the two placeholders:
--   <PROJECT_REF>  your project ref (the xxxxx in https://xxxxx.supabase.co)
--   <SYNC_SECRET>  the same value you set as the SYNC_SECRET function secret
--
-- Requires the pg_cron and pg_net extensions. On Supabase enable both from
-- Dashboard -> Integrations (Cron, and "pg_net" under Database -> Extensions);
-- the two `create extension` lines below are a no-op once that's done.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 10:00 UTC daily = 5am Central / 6am Eastern, so the day's events are in
-- place before the morning. Edit the cron expression to taste, e.g.
-- '0 */6 * * *' for every six hours -- the function is cheap to run.
select cron.schedule(
  'sync-google-calendar-daily',
  '0 10 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-google-calendar',
    headers := '{"Content-Type": "application/json", "x-sync-secret": "<SYNC_SECRET>"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- Useful afterwards:
--   select * from cron.job;                                   -- is it scheduled?
--   select * from cron.job_run_details order by start_time desc limit 10;  -- did it run?
--   select cron.unschedule('sync-google-calendar-daily');     -- remove it
