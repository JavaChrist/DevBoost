-- DevBoost — Schéma cloud pour la synchronisation multi-appareils.
--
-- À copier-coller dans Supabase Dashboard → SQL Editor → New query → Run.
--
-- Stratégie : local-first. Chaque utilisateur garde ses données dans
-- IndexedDB localement, et l'app pousse / récupère depuis ces tables
-- pour rester en phase entre ses appareils.
-- Toutes les tables sont protégées par Row Level Security (RLS) :
-- chaque utilisateur ne peut voir et modifier QUE ses propres lignes.

-- ============================================================
-- 1. Profil & XP / Streak
-- ============================================================
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  last_session_date date,
  unlocked_themes text[] not null default array['javascript','react','algo'],
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. Réglages utilisateur
-- ============================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_duration integer not null default 5,
  themes text[] not null default array['javascript','react','algo','html','css','ia'],
  notify_at text,
  sound boolean not null default false,
  haptic boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. Reviews SM-2 (append-only : 1 ligne par carte révisée)
-- ============================================================
create table if not exists public.reviews (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  quality integer not null,
  ease_factor numeric not null,
  interval integer not null,
  next_review timestamptz not null,
  reviewed_at timestamptz not null default now()
);

create index if not exists reviews_user_idx on public.reviews(user_id);
create index if not exists reviews_user_card_idx on public.reviews(user_id, card_id);

-- ============================================================
-- 4. Sessions terminées (append-only)
-- ============================================================
create table if not exists public.sessions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cards_count integer not null,
  passed integer not null,
  duration_sec integer,
  finished_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on public.sessions(user_id);

-- ============================================================
-- 5. Progression dans les cours
-- ============================================================
create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  last_section integer not null default 0,
  sections_done integer[] not null default array[]::integer[],
  quiz_done boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

-- ============================================================
-- 6. Cartes personnelles (créées dans la Library)
-- ============================================================
-- On stocke la carte entière en jsonb pour ne pas avoir à versionner
-- le schéma de carte ici (les cartes seedées restent locales).
create table if not exists public.user_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists user_cards_user_idx on public.user_cards(user_id);

-- ============================================================
-- RLS — chaque user ne voit / modifie que ses lignes
-- ============================================================
alter table public.user_stats       enable row level security;
alter table public.user_settings    enable row level security;
alter table public.reviews          enable row level security;
alter table public.sessions         enable row level security;
alter table public.course_progress  enable row level security;
alter table public.user_cards       enable row level security;

-- Policy générique : "owner only" pour SELECT / INSERT / UPDATE / DELETE
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_stats',
    'user_settings',
    'reviews',
    'sessions',
    'course_progress',
    'user_cards'
  ]) loop
    execute format('drop policy if exists "own_select"  on public.%I', t);
    execute format('drop policy if exists "own_insert"  on public.%I', t);
    execute format('drop policy if exists "own_update"  on public.%I', t);
    execute format('drop policy if exists "own_delete"  on public.%I', t);

    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============================================================
-- Trigger : touche updated_at à chaque update
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_stats',
    'user_settings',
    'course_progress',
    'user_cards'
  ]) loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
