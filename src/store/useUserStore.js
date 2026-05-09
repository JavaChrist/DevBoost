import { create } from 'zustand';

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

  addXP: (delta) => set((s) => ({ xp: Math.max(0, s.xp + delta) })),

  setStreak: (streak, lastSessionDate) => set({ streak, lastSessionDate }),

  unlockTheme: (theme) =>
    set((s) =>
      s.unlockedThemes.includes(theme)
        ? s
        : { unlockedThemes: [...s.unlockedThemes, theme] },
    ),
}));
