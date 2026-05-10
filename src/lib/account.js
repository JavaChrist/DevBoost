// DevBoost — gestion du compte utilisateur (suppression RGPD, export…).
//
// La suppression appelle la fonction RPC `delete_my_account()` côté
// Supabase (cf. supabase/migrations/002_delete_account.sql), qui efface
// la ligne dans `auth.users` et déclenche le cascade sur toutes les
// tables publiques.
//
// Côté local, on vide aussi IndexedDB pour ne laisser AUCUNE trace
// résiduelle sur l'appareil.

import { supabase, isSupabaseConfigured } from './supabase.js';
import db from '../db/dexie.js';
import { flushAllScheduled } from './cloudSync.js';

export async function deleteAccount() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré : impossible de supprimer le compte.');
  }

  // 1. Annule les pushes debounced en attente — inutile de tenter de
  //    sync vers un compte qu'on s'apprête à supprimer.
  flushAllScheduled();

  // 2. Appel RPC : supprime auth.users (cascade sur les tables publiques).
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    throw new Error(error.message || 'Erreur lors de la suppression côté serveur.');
  }

  // 3. SignOut : invalide le token JWT côté client.
  //    On ignore une éventuelle erreur car l'utilisateur n'existe plus.
  await supabase.auth.signOut().catch(() => {});

  // 4. Vide IndexedDB locale.
  try {
    await Promise.all([
      db.cards.clear(),
      db.reviews.clear(),
      db.sessions.clear(),
      db.userStats.clear(),
      db.settings.clear(),
      db.courses.clear(),
      db.courseProgress.clear(),
    ]);
  } catch {
    // Tant pis, l'essentiel (suppression serveur + signOut) est fait.
  }

  return { ok: true };
}
