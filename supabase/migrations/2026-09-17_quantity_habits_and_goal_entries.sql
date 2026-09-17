-- Run once in the Supabase SQL editor (project already has the base schema).
-- Adds: quantity habits (a daily target + logged amount) and goal entries
-- (each counter increment is a labelled, dated row -- e.g. a book title).
-- schema.sql carries the same definitions for fresh installs.

-- ── Quantity habits ───────────────────────────────────────────────────────
-- target_value null = plain check-off habit (unchanged behaviour).
alter table public.habits
  add column target_value numeric check (target_value > 0),
  add column unit text not null default '';

-- Amount logged that day for a quantity habit; null for a plain check.
alter table public.habit_logs
  add column value numeric check (value >= 0);

-- ── Goal entries ──────────────────────────────────────────────────────────
create table public.goal_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default '',
  value integer not null default 1 check (value > 0),
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index goal_entries_user_goal_idx on public.goal_entries (user_id, goal_id);

alter table public.goal_entries enable row level security;
create policy "individual access" on public.goal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- goals.counter_current is now derived: the sum of the goal's entries.
create or replace function public.sync_goal_counter() returns trigger
language plpgsql as $$
declare
  gid uuid := coalesce(new.goal_id, old.goal_id);
begin
  update public.goals
     set counter_current = coalesce((select sum(value) from public.goal_entries where goal_id = gid), 0),
         updated_at = now()
   where id = gid;
  return null;
end $$;

create trigger goal_entries_sync
  after insert or update or delete on public.goal_entries
  for each row execute function public.sync_goal_counter();

-- Backfill: turn each existing counter's progress into that many untitled
-- entries (dated today) so nothing is lost; rename them from the goal card.
insert into public.goal_entries (goal_id, user_id, label, entry_date)
select g.id, g.user_id, '', current_date
  from public.goals g, generate_series(1, greatest(g.counter_current, 0))
 where g.goal_type = 'counter' and g.counter_current > 0;
