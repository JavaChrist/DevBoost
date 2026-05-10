import { create } from 'zustand';
import { pushUserStats, schedulePush } from '../lib/cloudSync.js';
import { useAuthStore } from './useAuthStore.js';

// Pousse les stats vers le cloud, debounced à 2s pour grouper les
// rafales (ex: à la fin d'une session, addXP + setStreak presque
// simultanés → un seul upsert réseau).
function pushStatsDebounced() {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  schedulePush('user_stats', () => pushUserStats(userId));
}

export const useUserStore = create((set) => ({
  xp: 0,
  streak: 0,
  lastSessionDate: null,
  unlockedThemes: ['javascript', 'react', 'algo'],

  hydrate: (user) =>
    set({
      xp: user?.xp ?? 0,
      streak: user?.streak ?? 0,
      lastSessionDate: user?.lastSessionDate ?? null,
      unlockedThemes: user?.unlockedThemes ?? ['javascript', 'react', 'algo'],
    }),

  addXP: (delta) => {
    set((s) => ({ xp: Math.max(0, s.xp + delta) }));
    pushStatsDebounced();
  },

  setStreak: (streak, lastSessionDate) => {
    set({ streak, lastSessionDate });
    pushStatsDebounced();
  },

  unlockTheme: (theme) => {
    set((s) =>
      s.unlockedThemes.includes(theme)
        ? s
        : { unlockedThemes: [...s.unlockedThemes, theme] },
    );
    pushStatsDebounced();
  },
}));
