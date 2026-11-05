-- Your Perfect Week — initial schema.
-- Every table holds one person's data and has row-level security: a signed-in user
-- reads and writes only rows whose user_id is their own id. No table is readable
-- by anonymous visitors. Times are timestamptz (instants); the time zone the person
-- was in is kept next to each record so history displays correctly after travel.

create extension if not exists btree_gist;

-- ---------- helpers ----------

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.is_valid_time_zone(tz text) returns boolean
language sql stable as $$
  select exists (select 1 from pg_timezone_names where name = tz)
$$;

-- ---------- settings ----------

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  time_zone text not null default 'UTC',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  hour12 boolean not null default false,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  timeline_zoom text not null default 'detailed' check (timeline_zoom in ('compact', 'detailed')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_tz_valid check (public.is_valid_time_zone(time_zone))
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  day_review_time time,           -- e.g. 21:30 local
  week_review_weekday smallint check (week_review_weekday between 0 and 6),
  week_review_time time,
  untracked_nudge boolean not null default false,
  quiet_start time,
  quiet_end time,
  updated_at timestamptz not null default now()
);

-- A new account gets its settings rows.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- library: categories and activities ----------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text check (char_length(icon) <= 40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index if not exists categories_user_name on public.categories (user_id, lower(btrim(name)));

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  color text check (color ~ '^#[0-9a-fA-F]{6}$'),           -- null: use the category colour
  icon text check (char_length(icon) <= 40),
  description text check (char_length(description) <= 500),
  default_duration_min integer check (default_duration_min between 1 and 1440),
  importance smallint check (importance between 1 and 5),
  activity_class text check (activity_class in ('essential', 'flexible', 'discretionary', 'recovery')),
  adjustable boolean not null default false,                  -- the person decides, never inferred
  archived_at timestamptz,                                    -- hidden from pickers, history kept
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  -- A category in use cannot be deleted; move its activities first.
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict
);
create unique index if not exists activities_user_name on public.activities (user_id, lower(btrim(name)))
  where archived_at is null;

-- ---------- recorded time ----------

create table if not exists public.activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz,                                         -- null: timer running
  time_zone text not null default 'UTC' check (public.is_valid_time_zone(time_zone)),
  source text not null default 'manual'
    check (source in ('manual', 'timer', 'retro', 'template', 'suggestion', 'import')),
  external_source text check (char_length(external_source) <= 60), -- future integrations
  external_id text check (char_length(external_id) <= 200),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_positive check (end_at is null or end_at > start_at),
  constraint record_max_length check (end_at is null or end_at - start_at <= interval '72 hours'),
  constraint record_external_pair check ((external_source is null) = (external_id is null)),
  -- Records may not cross user boundaries through the activity.
  foreign key (activity_id, user_id) references public.activities (id, user_id) on delete restrict,
  -- No two recorded blocks of one person overlap. A running timer occupies [start, ∞).
  constraint records_no_overlap exclude using gist (
    user_id with =,
    tstzrange(start_at, coalesce(end_at, 'infinity'::timestamptz), '[)') with &&
  ) deferrable initially immediate
);
create unique index if not exists records_one_running on public.activity_records (user_id) where end_at is null;
create unique index if not exists records_external on public.activity_records (user_id, external_source, external_id)
  where external_id is not null;
create index if not exists records_user_start on public.activity_records (user_id, start_at);

-- Recorded time is the past. Planned time lives in plans, not here.
create or replace function public.records_not_in_future() returns trigger
language plpgsql as $$
begin
  if new.start_at > now() + interval '5 minutes'
     or (new.end_at is not null and new.end_at > now() + interval '5 minutes') then
    raise exception 'A recorded activity cannot end in the future. Plan it in your Perfect Week instead.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists records_not_in_future on public.activity_records;
create trigger records_not_in_future before insert or update of start_at, end_at on public.activity_records
  for each row execute function public.records_not_in_future();

-- ---------- live timer (server clock, survives refresh and device lock) ----------

-- Stops whatever is running and starts `p_activity_id`, in one transaction.
create or replace function public.start_activity(p_activity_id uuid, p_notes text default null)
returns public.activity_records
language plpgsql security invoker set search_path = public as $$
declare
  t timestamptz := now();
  tz text;
  rec public.activity_records;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select time_zone into tz from public.user_settings where user_id = auth.uid();
  -- Switching within a minute of starting is a correction (wrong button), not a
  -- one-minute activity: the mistaken timer is replaced instead of kept.
  delete from public.activity_records
    where user_id = auth.uid() and end_at is null and start_at > t - interval '1 minute';
  update public.activity_records set end_at = t
    where user_id = auth.uid() and end_at is null;
  insert into public.activity_records (user_id, activity_id, start_at, time_zone, source, notes)
    values (auth.uid(), p_activity_id, t, coalesce(tz, 'UTC'), 'timer', p_notes)
    returning * into rec;
  return rec;
end $$;

create or replace function public.stop_activity()
returns public.activity_records
language plpgsql security invoker set search_path = public as $$
declare
  rec public.activity_records;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  update public.activity_records set end_at = now()
    where user_id = auth.uid() and end_at is null and start_at < now()
    returning * into rec;
  return rec;
end $$;

-- ---------- plans: recurring activities, routines, ideal weeks ----------

create table if not exists public.recurring_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_id uuid not null,
  weekdays smallint[] not null check (cardinality(weekdays) between 1 and 7 and weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  start_minute smallint not null check (start_minute between 0 and 1439),
  duration_min integer not null check (duration_min between 1 and 1440),
  starts_on date not null default current_date,
  ends_on date,
  interval_weeks smallint not null default 1 check (interval_weeks between 1 and 8),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  foreign key (activity_id, user_id) references public.activities (id, user_id) on delete cascade
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  default_start_minute smallint check (default_start_minute between 0 and 1439),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid not null,
  activity_id uuid not null,
  offset_min integer not null check (offset_min between 0 and 1440),
  duration_min integer not null check (duration_min between 1 and 1440),
  sort_order integer not null default 0,
  foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade,
  foreign key (activity_id, user_id) references public.activities (id, user_id) on delete cascade
);

create table if not exists public.ideal_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'My Perfect Week' check (char_length(btrim(name)) between 1 and 60),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index if not exists ideal_weeks_one_active on public.ideal_weeks (user_id) where is_active;

create table if not exists public.ideal_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ideal_week_id uuid not null,
  activity_id uuid,
  category_id uuid,
  weekday smallint not null check (weekday between 0 and 6),
  start_minute smallint not null check (start_minute between 0 and 1439),
  duration_min integer not null check (duration_min between 1 and 1440),
  check (activity_id is not null or category_id is not null),
  foreign key (ideal_week_id, user_id) references public.ideal_weeks (id, user_id) on delete cascade,
  foreign key (activity_id, user_id) references public.activities (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade
);

-- ---------- priorities, reflections, simulator scenarios ----------

create table if not exists public.priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  category_id uuid,
  target_min_per_week integer check (target_min_per_week between 0 and 10080),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id)
);

create table if not exists public.daily_reflections (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  feeling smallint check (feeling between 1 and 5),
  enough_personal_time boolean,
  felt_rushed boolean,
  time_on_priorities boolean,
  change_tomorrow text check (char_length(change_tomorrow) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_date)
);

create table if not exists public.recovery_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  adjustments jsonb not null default '[]' check (jsonb_typeof(adjustments) = 'array'),
  started_on date,                       -- when the person decided to try it, for "actually reclaimed"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------

do $$
declare t text;
begin
  foreach t in array array['user_settings', 'notification_preferences', 'categories', 'activities',
    'activity_records', 'recurring_activities', 'routines', 'ideal_weeks', 'daily_reflections', 'recovery_scenarios']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
      for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- row-level security ----------

do $$
declare t text;
begin
  foreach t in array array['user_settings', 'notification_preferences', 'categories', 'activities',
    'activity_records', 'recurring_activities', 'routines', 'routine_items', 'ideal_weeks', 'ideal_blocks',
    'priorities', 'daily_reflections', 'recovery_scenarios']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format('create policy own_rows on public.%I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Settings rows are created by the sign-up trigger, never inserted or deleted by the client.
revoke insert, delete on public.user_settings, public.notification_preferences from authenticated;

revoke execute on function public.start_activity(uuid, text), public.stop_activity() from public, anon;
grant execute on function public.start_activity(uuid, text), public.stop_activity() to authenticated;

-- ---------- erase my data ----------

-- Removes every row the signed-in person owns. Removing the sign-in itself needs the
-- service role and is done by a server function (see docs/ARCHITECTURE.md).
create or replace function public.delete_my_data() returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from public.activity_records where user_id = auth.uid();
  delete from public.ideal_blocks where user_id = auth.uid();
  delete from public.ideal_weeks where user_id = auth.uid();
  delete from public.routine_items where user_id = auth.uid();
  delete from public.routines where user_id = auth.uid();
  delete from public.recurring_activities where user_id = auth.uid();
  delete from public.priorities where user_id = auth.uid();
  delete from public.daily_reflections where user_id = auth.uid();
  delete from public.recovery_scenarios where user_id = auth.uid();
  delete from public.activities where user_id = auth.uid();
  delete from public.categories where user_id = auth.uid();
end $$;

revoke execute on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
