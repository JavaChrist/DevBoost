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

// ---------------------------------------------------------------
// Export RGPD : récupère toutes les données utilisateur côté
// Supabase + IndexedDB et déclenche un téléchargement JSON.
// ---------------------------------------------------------------

export async function exportAllData(user) {
  const userId = user?.id ?? null;
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: 'DevBoost v0.1',
    profile: {
      id: userId,
      email: user?.email ?? null,
      firstName: user?.firstName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
    },
    cloud: {
      configured: isSupabaseConfigured,
      stats: null,
      settings: null,
      reviews: [],
      sessions: [],
      courseProgress: [],
      userCards: [],
    },
    local: {
      cards: [],
      reviews: [],
      sessions: [],
      userStats: [],
      settings: [],
      courses: [],
      courseProgress: [],
    },
  };

  // --- Cloud (si user connecté) ---
  if (isSupabaseConfigured && userId) {
    const safe = (q) => q.then((r) => r.data ?? []).catch(() => []);
    const safeOne = (q) => q.then((r) => r.data ?? null).catch(() => null);

    const [stats, settings, reviews, sessions, courseProgress, userCards] = await Promise.all([
      safeOne(supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()),
      safeOne(supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()),
      safe(supabase.from('reviews').select('*').eq('user_id', userId)),
      safe(supabase.from('sessions').select('*').eq('user_id', userId)),
      safe(supabase.from('course_progress').select('*').eq('user_id', userId)),
      safe(supabase.from('user_cards').select('*').eq('user_id', userId)),
    ]);

    payload.cloud = {
      configured: true,
      stats,
      settings,
      reviews,
      sessions,
      courseProgress,
      userCards,
    };
  }

  // --- Local IndexedDB (toujours) ---
  try {
    const [cards, reviews, sessions, userStats, settings, courses, courseProgress] =
      await Promise.all([
        db.cards.toArray(),
        db.reviews.toArray(),
        db.sessions.toArray(),
        db.userStats.toArray(),
        db.settings.toArray(),
        db.courses.toArray(),
        db.courseProgress.toArray(),
      ]);
    payload.local = {
      cards,
      reviews,
      sessions,
      userStats,
      settings,
      courses,
      courseProgress,
    };
  } catch {
    // peu probable, IndexedDB devrait être dispo
  }

  return payload;
}

export async function downloadExport(user) {
  const data = await exportAllData(user);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const safeEmail = (user?.email || 'anonymous').replace(/[^a-z0-9]+/gi, '_');
  const filename = `devboost-export-${safeEmail}-${stamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Petite tempo avant revoke pour laisser au navigateur le temps de
  // déclencher le téléchargement (Safari notamment).
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { filename, sizeBytes: blob.size };
}

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
