-- DevBoost — Avatars utilisateur (Supabase Storage).
--
-- À copier-coller dans Supabase Dashboard → SQL Editor → New query → Run.
--
-- Crée le bucket public "avatars" et applique des policies RLS pour que :
-- - tout le monde puisse LIRE les avatars (public bucket — l'URL est
--   embarquée dans user_metadata.avatar_url)
-- - seul le propriétaire puisse uploader / écraser / supprimer un fichier
--   placé dans son propre dossier {user_id}/...
--
-- Convention de chemin :
--   avatars/{user_id}/avatar.jpg
--
-- L'URL publique côté client est récupérable via :
--   supabase.storage.from('avatars').getPublicUrl(path)

-- 1. Création du bucket public si absent.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Policies RLS (storage.objects)
--    On (re)crée pour rester idempotent.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
