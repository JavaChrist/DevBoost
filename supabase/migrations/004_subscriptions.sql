-- DevBoost — Système d'abonnement Premium (Mollie).
--
-- À copier-coller dans Supabase Dashboard → SQL Editor → New query → Run.
--
-- Modèle :
-- - 1 ligne par utilisateur dans subscriptions (1:1)
-- - status ∈ ('free', 'trialing', 'active', 'cancelled', 'expired')
-- - trial_ends_at : fin du mois gratuit (statut 'trialing')
-- - current_period_ends_at : fin de la période payée (statut 'active')
-- - mollie_* : références côté Mollie (customer + subscription)
--
-- Flow free trial sans CB :
--   1. User clique "Démarrer mon mois gratuit" → start_free_trial() RPC
--      → status='trialing', trial_ends_at=now()+30j (sans appel Mollie)
--   2. User a 30 jours d'accès Premium gratuit
--   3. À expiration : status devient 'expired' (vérifié à chaque is_premium())
--   4. User clique "S'abonner" → Edge Function crée customer Mollie +
--      first payment + subscription → webhook met status='active'
--
-- is_premium(uid) : helper SQL utilisable depuis n'importe quelle policy
-- ou requête. Renvoie true si l'user a un abonnement actif OU est en
-- période d'essai non expirée.

-- ============================================================
-- 1. Table subscriptions
-- ============================================================
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free' check (
    status in ('free', 'trialing', 'active', 'cancelled', 'expired')
  ),
  plan text not null default 'monthly_4_99',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  cancelled_at timestamptz,
  mollie_customer_id text,
  mollie_subscription_id text,
  mollie_mandate_id text,
  trial_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions(status);

-- ============================================================
-- 2. Audit log des évènements Mollie (webhooks, paiements)
-- ============================================================
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  mollie_payment_id text,
  mollie_subscription_id text,
  amount_cents integer,
  currency text default 'EUR',
  status text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_user_idx on public.payment_events(user_id);
create index if not exists payment_events_created_idx on public.payment_events(created_at desc);

-- ============================================================
-- 3. RLS — owner-only sur subscriptions, lecture only sur events
-- ============================================================
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "subs_own_select" on public.subscriptions;
create policy "subs_own_select"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE sont réservés aux Edge Functions (service role
-- bypass RLS). On bloque l'écriture côté client pour empêcher qu'un
-- utilisateur ne se mette lui-même en 'active' via la clé anon.
drop policy if exists "subs_no_client_write" on public.subscriptions;
create policy "subs_no_client_write"
  on public.subscriptions for all
  using (false)
  with check (false);

drop policy if exists "events_own_select" on public.payment_events;
create policy "events_own_select"
  on public.payment_events for select
  using (auth.uid() = user_id);

-- ============================================================
-- 4. Trigger updated_at sur subscriptions
-- ============================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- 5. RPC : start_free_trial — démarre le mois gratuit sans CB
-- ============================================================
-- security definer pour pouvoir insérer/maj malgré la policy
-- "no_client_write". Vérifie que l'utilisateur n'a jamais utilisé son
-- trial (champ trial_used).
create or replace function public.start_free_trial()
returns subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  result subscriptions;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Crée la ligne si elle n'existe pas, ou la met à jour si l'user a
  -- jamais utilisé son trial. Sinon refuse.
  insert into public.subscriptions (user_id, status, trial_started_at, trial_ends_at, trial_used)
  values (uid, 'trialing', now(), now() + interval '30 days', true)
  on conflict (user_id) do update
  set status = case
    when subscriptions.trial_used = true then subscriptions.status
    else 'trialing'
  end,
  trial_started_at = case
    when subscriptions.trial_used = true then subscriptions.trial_started_at
    else now()
  end,
  trial_ends_at = case
    when subscriptions.trial_used = true then subscriptions.trial_ends_at
    else now() + interval '30 days'
  end,
  trial_used = true
  returning * into result;

  return result;
end;
$$;

revoke all on function public.start_free_trial() from public;
grant execute on function public.start_free_trial() to authenticated;

-- ============================================================
-- 6. is_premium(uid) — helper réutilisable
-- ============================================================
create or replace function public.is_premium(uid uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
    and (
      (s.status = 'active' and (s.current_period_ends_at is null or s.current_period_ends_at > now()))
      or (s.status = 'trialing' and s.trial_ends_at > now())
    )
  );
$$;

grant execute on function public.is_premium(uuid) to authenticated, anon;
