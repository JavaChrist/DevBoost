import { create } from 'zustand';
import db from '../db/dexie.js';
import { sm2, SWIPE_QUALITY } from '../lib/sm2.js';
import { buildSession } from '../lib/sessionBuilder.js';
import { nextStreak } from '../lib/streak.js';
import { sound, vibrate } from '../lib/feedback.js';
import { useUserStore } from './useUserStore.js';
import { useSettingsStore } from './useSettingsStore.js';
import { useAuthStore } from './useAuthStore.js';
import { toast } from './useToastStore.js';
import { pushReview, pushSession, pushUserStats } from '../lib/cloudSync.js';

const XP_PASS = 10;
const XP_BONUS_CHALLENGE = 10; // bonus si challenge réussi

export const useSessionStore = create((set, get) => ({
  cards: [],
  index: 0,
  results: [], // [{ cardId, quality, ok, xpGained }]
  startedAt: null,
  finishedAt: null,
  loading: false,
  error: null,

  startFromDb: async (opts = {}) => {
    set({ loading: true, error: null });
    try {
      const [allCards, settings] = await Promise.all([db.cards.toArray(), db.settings.get(1)]);
      const themes = opts.themes ?? settings?.themes ?? null;
      // Heuristique : ~30s par carte → durée (min) × 2 = total cartes, ratio 70/30 quiz/challenge
      const duration = Math.max(2, Math.min(10, Number(settings?.sessionDuration) || 5));
      const total = duration * 2;
      const challengeCount = Math.max(1, Math.round(total * 0.3));
      const quizCount = Math.max(1, total - challengeCount);
      const cards = buildSession({ cards: allCards, themes, quizCount, challengeCount });
      set({
        cards,
        index: 0,
        results: [],
        startedAt: Date.now(),
        finishedAt: null,
        loading: false,
      });
      return cards.length;
    } catch (err) {
      set({ loading: false, error: err });
      throw err;
    }
  },

  start: (cards) =>
    set({
      cards,
      index: 0,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
    }),

  // quality 0..5 — déclenche SM-2, persiste la carte, insère un review.
  answer: async (quality) => {
    const { cards, index, results } = get();
    const card = cards[index];
    if (!card) return;

    const sm = sm2(card, quality);
    const ok = quality >= 3;
    const xpGained = ok ? XP_PASS + (card.type === 'challenge' ? XP_BONUS_CHALLENGE : 0) : 0;
    const reviewedAt = new Date();

    try {
      await db.transaction('rw', [db.cards, db.reviews], async () => {
        await db.cards.update(card.id, {
          easeFactor: sm.easeFactor,
          interval: sm.interval,
          repetitions: sm.repetitions,
          nextReview: sm.nextReview,
          lastReview: reviewedAt,
        });
        await db.reviews.add({
          cardId: card.id,
          date: reviewedAt,
          quality,
          easeFactor: sm.easeFactor,
          interval: sm.interval,
          nextReview: sm.nextReview,
        });
      });
    } catch (err) {
      // On garde le flow utilisable même si la persistence échoue (rare en local).
      // eslint-disable-next-line no-console
      console.error('[answer] persistence failed', err);
    }

    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.debug(
        `[SM-2] card ${card.id} q=${quality} → EF=${sm.easeFactor.toFixed(2)} ` +
          `interval=${sm.interval}j nextReview=${sm.nextReview.toISOString().slice(0, 10)}`,
      );
    }

    // Feedback (opt-in via Settings)
    const settings = useSettingsStore.getState();
    if (settings.sound) (ok ? sound.ok : sound.fail)();
    if (settings.haptic) vibrate(ok ? 25 : [40, 30, 40]);
    if (xpGained > 0) toast.success(`+${xpGained} XP`);

    // Push cloud (fire-and-forget) : 1 review = 1 insert.
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      pushReview(userId, {
        cardId: card.id,
        quality,
        easeFactor: sm.easeFactor,
        interval: sm.interval,
        nextReview: sm.nextReview,
        date: reviewedAt,
      }).catch(() => {});
    }

    const nextIndex = index + 1;
    const newResults = [...results, { cardId: card.id, quality, ok, xpGained }];
    const isLast = nextIndex >= cards.length;

    set({
      results: newResults,
      index: nextIndex,
      finishedAt: isLast ? Date.now() : null,
    });

    if (isLast) await get().finish();
  },

  // Variantes ergonomiques pour brancher swipe / boutons.
  answerOk: () => get().answer(SWIPE_QUALITY.ok),
  answerRetry: () => get().answer(SWIPE_QUALITY.retry),

  finish: async () => {
    const { cards, results, startedAt } = get();
    const finishedAt = Date.now();
    const durationSec = Math.max(1, Math.round((finishedAt - (startedAt ?? finishedAt)) / 1000));
    const passed = results.filter((r) => r.ok).length;
    const xpGained = results.reduce((s, r) => s + r.xpGained, 0);
    const today = new Date();

    const user = useUserStore.getState();
    const newStreak = nextStreak({
      currentStreak: user.streak,
      lastSessionDate: user.lastSessionDate,
      today,
    });
    const newXp = user.xp + xpGained;

    try {
      await db.transaction('rw', [db.sessions, db.user], async () => {
        await db.sessions.add({
          date: today,
          durationSec,
          cardsCount: cards.length,
          passed,
        });
        await db.user.update(1, {
          xp: newXp,
          streak: newStreak,
          lastSessionDate: today,
        });
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[finish] persistence failed', err);
    }

    useUserStore.getState().hydrate({
      ...user,
      xp: newXp,
      streak: newStreak,
      lastSessionDate: today,
    });

    if (newStreak > (user.streak ?? 0)) {
      toast.success(`Streak ${newStreak} 🔥`);
    }

    // Push cloud : 1 session + stats à jour (fire-and-forget).
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      pushSession(userId, {
        cardsCount: cards.length,
        passed,
        durationSec,
        date: today,
      }).catch(() => {});
      pushUserStats(userId).catch(() => {});
    }

    set({ finishedAt });
    return { xpGained, passed, total: cards.length, newStreak };
  },

  reset: () =>
    set({
      cards: [],
      index: 0,
      results: [],
      startedAt: null,
      finishedAt: null,
      error: null,
    }),

  current: () => {
    const { cards, index } = get();
    return cards[index] ?? null;
  },
  isFinished: () => {
    const { cards, index, finishedAt } = get();
    return finishedAt != null || (cards.length > 0 && index >= cards.length);
  },
}));

// Re-export utile pour les composants UI (boutons OK/À revoir → quality SM-2).
export { SWIPE_QUALITY };

// Aide au debug : fenêtre dev pour inspecter la session courante.
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.__session = useSessionStore;
}

