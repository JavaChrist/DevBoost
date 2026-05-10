# Supabase — DevBoost

Ce dossier contient les migrations SQL à appliquer manuellement sur ton
projet Supabase pour activer la synchronisation cloud.

## Comment appliquer une migration

1. Ouvre [Supabase Dashboard](https://app.supabase.com) → ton projet DevBoost
2. Va dans **SQL Editor → New query**
3. Copie-colle le contenu du fichier `migrations/00X_xxx.sql`
4. Clique **Run** (ou `Ctrl + Enter`)
5. Vérifie qu'il n'y a pas d'erreur en bas de la fenêtre

Les migrations sont **idempotentes** (`create table if not exists`,
`drop policy if exists`...), tu peux les rejouer sans risque.

## Migrations actuelles

| Fichier | Contenu |
| --- | --- |
| `001_cloud_sync.sql` | Tables `user_stats`, `user_settings`, `reviews`, `sessions`, `course_progress`, `user_cards` + RLS owner-only + triggers `updated_at` |
| `002_delete_account.sql` | Fonction RPC `delete_my_account()` (RGPD) — supprime l'utilisateur courant + cascade sur toutes ses données |

## RLS (Row Level Security)

Chaque table est protégée par 4 policies :
- `own_select`  : `auth.uid() = user_id`
- `own_insert`  : pareil sur `with check`
- `own_update`  : pareil
- `own_delete`  : pareil

→ un utilisateur ne peut **jamais** voir ou modifier les données d'un autre,
même en bypass de l'app (la clé `anon` ne peut rien faire sans token JWT
valide pointant vers son propre `user_id`).

## Vérifier que la migration est passée

Dans Supabase → **Table Editor**, tu dois voir les 6 tables listées
ci-dessus avec un cadenas vert (RLS activé).
