-- Daily Life App schema.
-- Hand-run in the Supabase SQL editor; kept here as source-of-truth documentation.
-- Every table uses the same RLS pattern: a user only ever sees/writes their own rows.

-- ─────────────────────────────────────────────────────────────────────────
-- Planner module
-- ─────────────────────────────────────────────────────────────────────────

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  hour smallint not null check (hour between 6 and 22),
  text text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, date, hour)
);
create index schedule_entries_user_date_idx on public.schedule_entries (user_id, date);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index todos_user_date_idx on public.todos (user_id, date);

-- Marks that a given date has been "opened" already, so the todo-rollover
-- (copy forward yesterday's incomplete todos) only ever runs once per date.
create table public.day_state (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table public.priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scope text not null check (scope in ('week', 'month')),
  period_key text not null, -- e.g. '2026-W36' or '2026-09'
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index priorities_user_period_idx on public.priorities (user_id, period_key);

-- ─────────────────────────────────────────────────────────────────────────
-- Habits module
-- ─────────────────────────────────────────────────────────────────────────

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'green' check (color in ('green', 'blue', 'orange', 'purple', 'teal')),
  icon text,
  target_value numeric check (target_value > 0), -- quantity habit ("10 pages"); null = plain check-off
  unit text not null default '',
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index habits_user_idx on public.habits (user_id);

-- user_id is duplicated here (not joined through habits) so RLS stays a
-- flat, fast check instead of a subquery against the habits table.
create table public.habit_logs (
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  value numeric check (value >= 0), -- amount logged for a quantity habit; null for a plain check
  primary key (habit_id, date)
);
create index habit_logs_user_date_idx on public.habit_logs (user_id, date);

-- ─────────────────────────────────────────────────────────────────────────
-- Journal module
-- ─────────────────────────────────────────────────────────────────────────

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index journal_entries_user_date_idx on public.journal_entries (user_id, date);

-- ─────────────────────────────────────────────────────────────────────────
-- Goals module
-- ─────────────────────────────────────────────────────────────────────────

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  category text not null default 'personal' check (category in ('personal', 'professional')),
  goal_type text not null default 'checklist' check (goal_type in ('checklist', 'counter')),
  counter_target integer,
  counter_current integer not null default 0,
  target_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id);

create table public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  target_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index goal_tasks_user_goal_idx on public.goal_tasks (user_id, goal_id);

-- Counter goals: each increment is a row here (a book title, a date...).
-- goals.counter_current is kept equal to the sum of a goal's entries by the
-- trigger below, so readers never have to aggregate.
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

-- ─────────────────────────────────────────────────────────────────────────
-- Notes module
-- ─────────────────────────────────────────────────────────────────────────

create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  color text not null default 'green' check (color in ('green', 'blue', 'orange', 'purple', 'teal')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index notebooks_user_idx on public.notebooks (user_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_notebook_idx on public.notes (notebook_id, position);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — one consistent policy per table
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'schedule_entries', 'todos', 'day_state', 'priorities',
      'habits', 'habit_logs',
      'journal_entries',
      'goals', 'goal_tasks', 'goal_entries',
      'notebooks', 'notes'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "individual access" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Google Calendar mirror
-- ─────────────────────────────────────────────────────────────────────────
-- Filled by the sync-google-calendar Edge Function (running as the service
-- role) on a schedule and on demand from Settings; the app itself only ever
-- reads it. Deliberately NOT part of the RLS loop above: users get a
-- select-only policy and there is no insert/update/delete policy at all, so
-- nothing the browser holds can write here. Setup: README.md, "Google
-- Calendar sync"; the cron job lives in supabase/calendar_sync_cron.sql.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_id text not null,
  calendar_name text not null default '',
  google_event_id text not null,
  title text not null default '',
  all_day boolean not null default false,
  start_at timestamptz,   -- timed events
  end_at timestamptz,
  start_date date,        -- all-day events; end_date is exclusive, as Google reports it
  end_date date,
  synced_at timestamptz not null default now(),
  unique (user_id, calendar_id, google_event_id),
  check (
    (all_day and start_date is not null and end_date is not null)
    or (not all_day and start_at is not null and end_at is not null)
  )
);
create index calendar_events_user_start_idx on public.calendar_events (user_id, start_at);
create index calendar_events_user_dates_idx on public.calendar_events (user_id, start_date, end_date);

alter table public.calendar_events enable row level security;
create policy "read own events" on public.calendar_events
  for select using (auth.uid() = user_id);
