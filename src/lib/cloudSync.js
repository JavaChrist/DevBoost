// DevBoost — couche de synchronisation IndexedDB ↔ Supabase.
//
// Stratégie : "local-first avec sync opportuniste"
// - L'app continue à lire / écrire dans Dexie (rapide, offline)
// - Au login : pull complet depuis le cloud → merge dans le local
// - À chaque mutation locale : push debounced vers le cloud
// - Au retour online : nouveau pull pour récupérer ce qui a bougé
//
// Conflits :
// - Lignes uniques (user_stats, user_settings, course_progress, user_cards) :
//   last-write-wins basé sur updated_at (le serveur tranche).
// - Append-only (reviews, sessions) : pas de conflit possible.

import { supabase, isSupabaseConfigured } from './supabase.js';
import db from '../db/dexie.js';
import { useUserStore } from '../store/useUserStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

const FIXED_DEFAULT_THEMES = ['javascript', 'react', 'algo'];

function nowIso() {
  return new Date().toISOString();
}

// Map snake_case (DB) ↔ camelCase (front)
function rowToUserStats(r) {
  if (!r) return null;
  return {
    id: 1,
    xp: r.xp ?? 0,
    streak: r.streak ?? 0,
    lastSessionDate: r.last_session_date ?? null,
    unlockedThemes: r.unlocked_themes ?? FIXED_DEFAULT_THEMES,
  };
}

function userStatsToRow(userId, s) {
  return {
    user_id: userId,
    xp: s.xp ?? 0,
    streak: s.streak ?? 0,
    last_session_date: s.lastSessionDate ?? null,
    unlocked_themes: s.unlockedThemes ?? FIXED_DEFAULT_THEMES,
    updated_at: nowIso(),
  };
}

function rowToSettings(r) {
  if (!r) return null;
  return {
    id: 1,
    sessionDuration: r.session_duration,
    themes: r.themes,
    notifyAt: r.notify_at ?? null,
    sound: r.sound,
    haptic: r.haptic,
  };
}

function settingsToRow(userId, s) {
  return {
    user_id: userId,
    session_duration: s.sessionDuration ?? 5,
    themes: s.themes ?? [],
    notify_at: s.notifyAt ?? null,
    sound: !!s.sound,
    haptic: !!s.haptic,
    updated_at: nowIso(),
  };
}

function rowToReview(r) {
  return {
    cardId: r.card_id,
    quality: r.quality,
    easeFactor: Number(r.ease_factor),
    interval: r.interval,
    nextReview: r.next_review,
    date: r.reviewed_at,
  };
}

function reviewToRow(userId, r) {
  return {
    user_id: userId,
    card_id: r.cardId,
    quality: r.quality,
    ease_factor: r.easeFactor,
    interval: r.interval,
    next_review: r.nextReview,
    reviewed_at: r.date ?? nowIso(),
  };
}

function rowToSession(r) {
  return {
    cardsCount: r.cards_count,
    passed: r.passed,
    durationSec: r.duration_sec ?? null,
    date: r.finished_at,
  };
}

function sessionToRow(userId, s) {
  return {
    user_id: userId,
    cards_count: s.cardsCount,
    passed: s.passed,
    duration_sec: s.durationSec ?? null,
    finished_at: s.date ?? nowIso(),
  };
}

function rowToCourseProgress(r) {
  return {
    slug: r.slug,
    lastSection: r.last_section ?? 0,
    sectionsDone: r.sections_done ?? [],
    quizDone: r.quiz_done ?? false,
    completed: r.completed ?? false,
    completedAt: r.completed_at ?? null,
  };
}

function courseProgressToRow(userId, p) {
  return {
    user_id: userId,
    slug: p.slug,
    last_section: p.lastSection ?? 0,
    sections_done: p.sectionsDone ?? [],
    quiz_done: !!p.quizDone,
    completed: !!p.completed,
    completed_at: p.completedAt ?? null,
    updated_at: nowIso(),
  };
}

function rowToUserCard(r) {
  // payload contient déjà la carte au format DevBoost
  return r.payload;
}

function userCardToRow(userId, card) {
  return {
    user_id: userId,
    id: String(card.id),
    payload: card,
    updated_at: nowIso(),
  };
}

// Une carte est "perso" si son id est une string (uuid / cuid…).
// Les cartes seedées ont un id numérique auto-incrémenté par Dexie.
function isUserCard(card) {
  return typeof card?.id === 'string';
}

// ---------------------------------------------------------------
// PULL (cloud → local)
// ---------------------------------------------------------------

export async function pullAllFromCloud(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: false };

  // 1. user_stats
  const { data: statsRow } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  const stats = rowToUserStats(statsRow);
  if (stats) {
    await db.user.put({ id: 1, ...stats });
    useUserStore.getState().hydrate(stats);
  }

  // 2. user_settings
  const { data: settingsRow } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  const settings = rowToSettings(settingsRow);
  if (settings) {
    await db.settings.put({ id: 1, ...settings });
    useSettingsStore.getState().hydrate(settings);
  }

  // 3. course_progress
  const { data: cpRows } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId);
  if (cpRows?.length) {
    const local = cpRows.map(rowToCourseProgress);
    // bulkPut : remplace les lignes locales avec le même slug
    await db.courseProgress.bulkPut(local);
  }

  // 4. user_cards (cartes perso uniquement, ne touche pas aux seedées)
  const { data: cardRows } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', userId);
  if (cardRows?.length) {
    const cards = cardRows.map(rowToUserCard);
    await db.cards.bulkPut(cards);
  }

  // 5. reviews — on importe celles qu'on n'a pas (par cardId + reviewedAt)
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: true })
    .limit(2000);
  if (reviewRows?.length) {
    const localReviews = await db.reviews.toArray();
    const seen = new Set(localReviews.map((r) => `${r.cardId}|${r.date}`));
    const toAdd = reviewRows
      .map(rowToReview)
      .filter((r) => !seen.has(`${r.cardId}|${r.date}`));
    if (toAdd.length) await db.reviews.bulkAdd(toAdd);
  }

  // 6. sessions — pareil
  const { data: sessionRows } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('finished_at', { ascending: true })
    .limit(2000);
  if (sessionRows?.length) {
    const localSessions = await db.sessions.toArray();
    const seen = new Set(localSessions.map((s) => `${s.date}|${s.cardsCount}`));
    const toAdd = sessionRows
      .map(rowToSession)
      .filter((s) => !seen.has(`${s.date}|${s.cardsCount}`));
    if (toAdd.length) await db.sessions.bulkAdd(toAdd);
  }

  return { ok: true };
}

// ---------------------------------------------------------------
// PUSH (local → cloud)
// ---------------------------------------------------------------

export async function pushUserStats(userId) {
  if (!isSupabaseConfigured || !userId) return;
  const local = useUserStore.getState();
  const row = userStatsToRow(userId, local);
  await supabase.from('user_stats').upsert(row, { onConflict: 'user_id' });
}

export async function pushSettings(userId) {
  if (!isSupabaseConfigured || !userId) return;
  const local = useSettingsStore.getState();
  const row = settingsToRow(userId, local);
  await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
}

export async function pushReview(userId, review) {
  if (!isSupabaseConfigured || !userId) return;
  await supabase.from('reviews').insert(reviewToRow(userId, review));
}

export async function pushSession(userId, session) {
  if (!isSupabaseConfigured || !userId) return;
  await supabase.from('sessions').insert(sessionToRow(userId, session));
}

export async function pushCourseProgress(userId, progress) {
  if (!isSupabaseConfigured || !userId) return;
  await supabase
    .from('course_progress')
    .upsert(courseProgressToRow(userId, progress), { onConflict: 'user_id,slug' });
}

export async function pushUserCard(userId, card) {
  if (!isSupabaseConfigured || !userId || !isUserCard(card)) return;
  await supabase
    .from('user_cards')
    .upsert(userCardToRow(userId, card), { onConflict: 'user_id,id' });
}

export async function deleteUserCard(userId, cardId) {
  if (!isSupabaseConfigured || !userId) return;
  await supabase.from('user_cards').delete().eq('user_id', userId).eq('id', String(cardId));
}

// Push complet : tout le local vers le cloud (utile pour la 1re sync
// quand l'utilisateur s'inscrit avec déjà des données locales).
export async function pushAllToCloud(userId) {
  if (!isSupabaseConfigured || !userId) return;
  await pushUserStats(userId);
  await pushSettings(userId);

  const allCp = await db.courseProgress.toArray();
  if (allCp.length) {
    await supabase
      .from('course_progress')
      .upsert(allCp.map((p) => courseProgressToRow(userId, p)), {
        onConflict: 'user_id,slug',
      });
  }

  const allCards = await db.cards.toArray();
  const userCards = allCards.filter(isUserCard);
  if (userCards.length) {
    await supabase
      .from('user_cards')
      .upsert(userCards.map((c) => userCardToRow(userId, c)), {
        onConflict: 'user_id,id',
      });
  }

  // Reviews et sessions : on n'envoie pas le passé en bulk (pas critique).
  // Les nouvelles sessions/reviews seront poussées au fil de l'eau.
}

// ---------------------------------------------------------------
// Debounce par clé (1 timer par ressource)
// ---------------------------------------------------------------

const timers = new Map();
export function schedulePush(key, fn, delay = 2000) {
  clearTimeout(timers.get(key));
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      Promise.resolve(fn()).catch((err) => {
        // eslint-disable-next-line no-console
        if (import.meta.env?.DEV) console.warn(`[sync:${key}]`, err);
      });
    }, delay),
  );
}

export function flushAllScheduled() {
  for (const [, timer] of timers) clearTimeout(timer);
  timers.clear();
}
