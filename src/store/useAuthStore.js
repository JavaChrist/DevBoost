// État d'authentification global. S'appuie sur Supabase Auth.
// - hydrate() : récupère la session existante au démarrage
// - listener auto sur onAuthStateChange : tient le state à jour si la session
//   est invalidée (logout d'un autre onglet, expiration, etc.)
// - À chaque connexion détectée, déclenche un pull cloud des données
//   utilisateur (XP, settings, course progress, cartes perso, reviews).
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { pullAllFromCloud } from '../lib/cloudSync.js';
import { useSyncStore } from './useSyncStore.js';

function pickProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    firstName: meta.first_name ?? meta.firstName ?? '',
    avatarUrl: meta.avatar_url ?? meta.avatarUrl ?? null,
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
    let firstUserId = null;
    try {
      const { data } = await supabase.auth.getSession();
      const profile = pickProfile(data?.session?.user);
      firstUserId = profile?.id ?? null;
      set({ user: profile, ready: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      if (import.meta.env?.DEV) console.error('[auth] hydrate error:', err);
      set({ user: null, ready: true, error: err });
    }

    // 1er pull si l'utilisateur était déjà connecté à l'ouverture de l'app.
    if (firstUserId) {
      runCloudPull(firstUserId);
    }

    // Écoute les changements (signin/signout/token refresh).
    let lastUserId = firstUserId;
    supabase.auth.onAuthStateChange((event, session) => {
      const profile = pickProfile(session?.user);
      set({ user: profile });
      // Pull à chaque nouvelle connexion (signin, oauth, recovery accepté…)
      // mais pas sur TOKEN_REFRESHED ni USER_UPDATED.
      if (
        profile?.id &&
        profile.id !== lastUserId &&
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
      ) {
        runCloudPull(profile.id);
      }
      lastUserId = profile?.id ?? null;
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

  // OAuth (Google, GitHub, etc.). Redirige le navigateur vers le provider,
  // puis Supabase consomme automatiquement le code au retour grâce à
  // detectSessionInUrl: true.
  signInWithProvider: async (provider) => {
    set({ loading: true, error: null });
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      set({ loading: false, error });
      return { ok: false, error };
    }
    // Pas de set({loading:false}) volontaire : la page va se naviguer vers
    // le provider, on laisse l'overlay actif jusqu'à la redirection.
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

  // Recharge le profil depuis Supabase (utile après un updateUser côté
  // helper, par ex. upload avatar). Pas de loading/error global pour ne
  // pas bloquer l'UI : c'est best-effort.
  refreshProfile: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const profile = pickProfile(data?.user);
      set({ user: profile });
      return profile;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper interne : pull cloud avec gestion d'état UI.
async function runCloudPull(userId) {
  const sync = useSyncStore.getState();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    sync.setOffline();
    return;
  }
  sync.setPulling();
  try {
    await pullAllFromCloud(userId);
    sync.setIdle();
  } catch (err) {
    // eslint-disable-next-line no-console
    if (import.meta.env?.DEV) console.warn('[sync] pull error:', err);
    sync.setError(err);
  }
}
