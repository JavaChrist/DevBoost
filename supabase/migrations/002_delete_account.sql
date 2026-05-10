-- DevBoost — Suppression de compte RGPD.
--
-- À copier-coller dans Supabase Dashboard → SQL Editor → New query → Run.
--
-- Crée une fonction RPC que l'utilisateur connecté peut appeler pour
-- supprimer DÉFINITIVEMENT son propre compte.
--
-- Sécurité :
-- - security definer : la fonction s'exécute avec les droits du
--   propriétaire (postgres) → elle peut toucher à auth.users.
-- - Mais elle n'agit QUE sur l'utilisateur courant (auth.uid()), donc
--   un attaquant ne peut pas supprimer le compte de quelqu'un d'autre.
-- - search_path explicite pour éviter les injections via fonctions
--   homonymes dans des schémas custom.
--
-- Effet :
-- - Suppression de la ligne dans auth.users
-- - Cascade automatique sur user_stats, user_settings, reviews,
--   sessions, course_progress, user_cards (grâce aux on delete cascade
--   définis en migration 001).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- On supprime explicitement de auth.users.
  -- Toutes les tables publiques avec FK on delete cascade vers
  -- auth.users(id) sont vidées automatiquement.
  delete from auth.users where id = uid;
end;
$$;

-- Permettre à un utilisateur authentifié d'appeler cette fonction.
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
