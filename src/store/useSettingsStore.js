import { create } from 'zustand';
import db from '../db/dexie.js';
import { KNOWN_THEMES } from '../lib/cards.js';
import { pushSettings, schedulePush } from '../lib/cloudSync.js';
import { useAuthStore } from './useAuthStore.js';

const DEFAULTS = {
  sessionDuration: 5, // minutes (indicatif → impacte quizCount/challengeCount)
  themes: KNOWN_THEMES,
  notifyAt: null, // 'HH:mm' ou null
  sound: false,
  haptic: true,
};

async function persist(patch) {
  try {
    await db.settings.update(1, patch);
  } catch {
    /* noop */
  }
  // Push cloud debounced (bouclé sur user_settings pour grouper).
  const userId = useAuthStore.getState().user?.id;
  if (userId) {
    schedulePush('user_settings', () => pushSettings(userId));
  }
}

export const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,

  hydrate: (settings) =>
    set({
      sessionDuration: settings?.sessionDuration ?? DEFAULTS.sessionDuration,
      themes: settings?.themes ?? DEFAULTS.themes,
      notifyAt: settings?.notifyAt ?? DEFAULTS.notifyAt,
      sound: settings?.sound ?? DEFAULTS.sound,
      haptic: settings?.haptic ?? DEFAULTS.haptic,
    }),

  setSessionDuration: (sessionDuration) => {
    set({ sessionDuration });
    persist({ sessionDuration });
  },
  setThemes: (themes) => {
    set({ themes });
    persist({ themes });
  },
  toggleTheme: (theme) => {
    const themes = get().themes.includes(theme)
      ? get().themes.filter((t) => t !== theme)
      : [...get().themes, theme];
    set({ themes });
    persist({ themes });
  },
  setNotifyAt: (notifyAt) => {
    set({ notifyAt });
    persist({ notifyAt });
  },
  setSound: (sound) => {
    set({ sound });
    persist({ sound });
  },
  setHaptic: (haptic) => {
    set({ haptic });
    persist({ haptic });
  },
}));
