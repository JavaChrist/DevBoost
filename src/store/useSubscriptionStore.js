// État abonnement Premium. Hydraté depuis Supabase au login, refresh
// manuel possible (ex: après retour d'un checkout Mollie).
import { create } from 'zustand';
import { fetchSubscription, deriveStatus } from '../lib/subscription.js';

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  loading: false,
  loaded: false,
  error: null,

  // Charge depuis Supabase. À appeler au login + après chaque mutation
  // (start trial, checkout retour, cancel).
  refresh: async (userId) => {
    if (!userId) {
      set({ subscription: null, loading: false, loaded: true });
      return null;
    }
    set({ loading: true, error: null });
    try {
      const sub = await fetchSubscription(userId);
      set({ subscription: sub, loading: false, loaded: true });
      return sub;
    } catch (err) {
      set({ loading: false, error: err, loaded: true });
      return null;
    }
  },

  // Mise à jour optimiste (ex: après start_free_trial RPC qui renvoie
  // déjà la nouvelle ligne).
  setSubscription: (sub) => set({ subscription: sub, loaded: true }),

  reset: () => set({ subscription: null, loading: false, loaded: false, error: null }),
}));

// Hook ergonomique : retourne directement les flags utiles pour le gating.
export function usePremium() {
  const sub = useSubscriptionStore((s) => s.subscription);
  const loaded = useSubscriptionStore((s) => s.loaded);
  const status = deriveStatus(sub);
  return { ...status, subscription: sub, loaded };
}
