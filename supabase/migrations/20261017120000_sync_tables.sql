-- Al-Murshid synced tables (SPEC section 9).
--
-- Personal data lives on the device first; these tables only back up and sync it for people
-- who opt into an account. Every row belongs to one user and Row Level Security limits each
-- user to their own rows. Rows carry a client `updated_at`, a trigger-set `server_updated_at`
-- (the pull cursor) and a `deleted` tombstone. Everything cascades when the auth user is deleted.
--
-- Not here on purpose: night reflections, Quran notes, app lock and Qibla calibration stay on
-- the device in v1. Religious content is bundled with the apps, never stored in the database.

-- ---------------------------------------------------------------------------------------------
-- Shared trigger: the server clock decides `server_updated_at`, whatever the client sends.
-- ---------------------------------------------------------------------------------------------
create or replace function public.touch_server_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- profiles: who the user is, as far as the UI needs (last write wins)
-- ---------------------------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Any ISO 639 code: adding a language is a content task, never a migration.
  locale text not null default 'ar' check (locale ~ '^[a-z]{2,3}$'),
  address_form text not null default 'neutral'
    check (address_form in ('masculine', 'feminine', 'neutral')),
  digits text not null default 'auto' check (digits in ('auto', 'arab', 'latn')),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- ---------------------------------------------------------------------------------------------
-- settings: prayer calculation and app preferences (last write wins)
-- Precise coordinates stay on the device: the server keeps a city label and coordinates
-- rounded to 2 decimals (about 1 km). numeric(5,2) rounds on write.
-- ---------------------------------------------------------------------------------------------
create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calculation_method text not null default 'auto' check (char_length(calculation_method) <= 40),
  asr_school text not null default 'standard' check (asr_school in ('standard', 'hanafi')),
  high_latitude_rule text not null default 'auto'
    check (high_latitude_rule in ('auto', 'middle_of_the_night', 'seventh_of_the_night', 'twilight_angle')),
  hijri_offset smallint not null default 0 check (hijri_offset between -2 and 2),
  city_label text check (char_length(city_label) <= 120),
  latitude numeric(5, 2) check (latitude between -90 and 90),
  longitude numeric(5, 2) check (longitude between -180 and 180),
  time_zone text check (char_length(time_zone) <= 64),
  theme text not null default 'auto' check (theme in ('light', 'dark', 'auto', 'prayer')),
  comfort_size numeric(3, 2) not null default 1 check (comfort_size between 1 and 2),
  simple_view boolean not null default false,
  reminders jsonb not null default '{}'::jsonb check (jsonb_typeof(reminders) = 'object'),
  quran_preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(quran_preferences) = 'object'),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- ---------------------------------------------------------------------------------------------
-- prayer_logs: one row per logged prayer (union, idempotent on the natural key)
-- ---------------------------------------------------------------------------------------------
create table public.prayer_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  prayer text not null check (prayer in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'taraweeh')),
  logged_at timestamptz not null,
  source text not null default 'app' check (source in ('app', 'notification', 'widget', 'web')),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, date, prayer)
);

-- ---------------------------------------------------------------------------------------------
-- fasting_logs: "fasted" or "not today", never a reason (union, idempotent)
-- ---------------------------------------------------------------------------------------------
create table public.fasting_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  fasted boolean not null,
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------------------------
-- journey_state: the current step per track, steps not scores (last write wins)
-- ---------------------------------------------------------------------------------------------
create table public.journey_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('prayer', 'quran', 'remembrance')),
  current_step text not null check (char_length(current_step) <= 64),
  step_history jsonb not null default '[]'::jsonb check (jsonb_typeof(step_history) = 'array'),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, track)
);

-- ---------------------------------------------------------------------------------------------
-- reading_progress: last read position (last write wins)
-- ---------------------------------------------------------------------------------------------
create table public.reading_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah between 1 and 286),
  page smallint check (page between 1 and 604),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- ---------------------------------------------------------------------------------------------
-- quran_bookmarks: several colored bookmarks (last write wins per row)
-- ---------------------------------------------------------------------------------------------
create table public.quran_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah between 1 and 286),
  color text not null default 'lantern' check (char_length(color) <= 24),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- ---------------------------------------------------------------------------------------------
-- khatmah_plans: a finish date or pages per day; the plan recalculates, it never shows debt
-- ---------------------------------------------------------------------------------------------
create table public.khatmah_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  target_date date,
  pages_per_day smallint check (pages_per_day between 1 and 604),
  current_page smallint not null default 0 check (current_page between 0 and 604),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  check (target_date is not null or pages_per_day is not null),
  check (target_date is null or target_date >= start_date)
);

-- ---------------------------------------------------------------------------------------------
-- tasbih_daily: one row per device, summed on read, so devices never overwrite each other
-- ---------------------------------------------------------------------------------------------
create table public.tasbih_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  phrase text not null check (
    phrase in ('subhanallah', 'alhamdulillah', 'allahu_akbar', 'la_ilaha_illa_allah', 'astaghfirullah', 'salawat')
  ),
  device_id uuid not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, date, phrase, device_id)
);

-- ---------------------------------------------------------------------------------------------
-- Per table: server clock trigger, pull index, Row Level Security (own rows only).
-- `(select auth.uid())` is evaluated once per statement instead of once per row.
-- ---------------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'prayer_logs', 'fasting_logs', 'journey_state',
    'reading_progress', 'quran_bookmarks', 'khatmah_plans', 'tasbih_daily'
  ]
  loop
    execute format(
      'create trigger touch_server_updated_at before insert or update on public.%I
         for each row execute function public.touch_server_updated_at()', t);

    execute format(
      'create index %I on public.%I (user_id, server_updated_at)', t || '_pull_idx', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);

    execute format(
      'create policy "own rows: select" on public.%I for select to authenticated
         using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "own rows: insert" on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "own rows: update" on public.%I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "own rows: delete" on public.%I for delete to authenticated
         using (user_id = (select auth.uid()))', t);

    -- Signed-out visitors never touch personal data.
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;
