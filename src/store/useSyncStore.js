import { create } from 'zustand';

// État de la synchro cloud (uniquement pour l'UI). La logique métier est
// dans src/lib/cloudSync.js — ce store ne sert qu'à afficher un indicateur
// "synchronisé il y a 30s" / "en cours" / "hors ligne".
export const useSyncStore = create((set) => ({
  status: 'idle', // 'idle' | 'pulling' | 'pushing' | 'error' | 'offline'
  lastSyncedAt: null, // timestamp ms de la dernière sync réussie (pull OU push)
  lastError: null,

  setPulling: () => set({ status: 'pulling', lastError: null }),
  setPushing: () => set({ status: 'pushing', lastError: null }),
  setIdle: () => set({ status: 'idle', lastSyncedAt: Date.now() }),
  setOffline: () => set({ status: 'offline' }),
  setError: (err) => set({ status: 'error', lastError: err?.message ?? String(err) }),
}));
