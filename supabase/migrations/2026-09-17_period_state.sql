-- Run once in the Supabase SQL editor. Lets unfinished week/month
-- priorities roll forward: the first time a period is opened, its
-- predecessor's incomplete priorities are copied in (same idea as
-- day_state for to-dos).

create table public.period_state (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scope text not null check (scope in ('week', 'month')),
  period_key text not null, -- e.g. '2026-W38' or '2026-09'
  created_at timestamptz not null default now(),
  primary key (user_id, scope, period_key)
);

alter table public.period_state enable row level security;
create policy "individual access" on public.period_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
