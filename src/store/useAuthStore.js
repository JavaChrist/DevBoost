// État d'authentification global. S'appuie sur Supabase Auth.
// - hydrate() : récupère la session existante au démarrage
// - listener auto sur onAuthStateChange : tient le state à jour si la session
//   est invalidée (logout d'un autre onglet, expiration, etc.)
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

function pickProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    firstName: meta.first_name ?? meta.firstName ?? '',
    createdAt: user.created_at,
  };
}

export const useAuthStore = create((set, get) => ({
  // --- état ---
  user: null, // { id, email, firstName, createdAt }
  ready: false, // a-t-on tenté de récupérer la session existante ?
  loading: false, // une op (signIn/signUp/signOut) est en cours
  error: null,
  configured: isSupabaseConfigured,

  // --- actions ---
  hydrate: async () => {
    if (get().ready) return;
    try {
      const { data } = await supabase.auth.getSession();
      set({ user: pickProfile(data?.session?.user), ready: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      if (import.meta.env?.DEV) console.error('[auth] hydrate error:', err);
      set({ user: null, ready: true, error: err });
    }

    // Écoute les changements (signin/signout/token refresh).
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: pickProfile(session?.user) });
    });
  },

  signUp: async ({ firstName, email, password }) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName?.trim() ?? '' },
      },
    });
    if (error) {
      set({ loading: false, error });
      return { ok: false, error };
    }
    set({ user: pickProfile(data?.user), loading: false });
    return { ok: true, needsConfirmation: !data?.session };
  },

  signIn: async ({ email, password }) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error });
      return { ok: false, error };
    }
    set({ user: pickProfile(data?.user), loading: false });
    return { ok: true };
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, loading: false });
    return { ok: true };
  },

  // Envoie le mail "réinitialise ton mot de passe". Le lien dans le mail
  // ramène l'utilisateur sur /update-password avec un token Supabase, qui
  // ouvre une session temporaire suffisante pour appeler updatePassword.
  requestPasswordReset: async ({ email }) => {
    set({ loading: true, error: null });
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/update-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      set({ loading: false, error });
      return { ok: false, error };
    }
    set({ loading: false });
    return { ok: true };
  },

  updatePassword: async ({ password }) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      set({ loading: false, error });
      return { ok: false, error };
    }
    set({ user: pickProfile(data?.user), loading: false });
    return { ok: true };
  },

  clearError: () => set({ error: null }),
}));
