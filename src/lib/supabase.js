// Client Supabase unique partagé dans toute l'app.
// Les credentials viennent de .env (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquants dans .env — ' +
      'le login ne fonctionnera pas tant que les credentials ne sont pas renseignés.',
  );
}

// Stub minimal en cas de config manquante : permet à l'app de charger
// (l'écran Login affichera un message d'erreur explicite).
const stub = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithPassword() {
      return { data: null, error: new Error('Supabase non configuré') };
    },
    async signUp() {
      return { data: null, error: new Error('Supabase non configuré') };
    },
    async signOut() {
      return { error: null };
    },
    async resetPasswordForEmail() {
      return { data: null, error: new Error('Supabase non configuré') };
    },
    async updateUser() {
      return { data: null, error: new Error('Supabase non configuré') };
    },
    async signInWithOAuth() {
      return { data: null, error: new Error('Supabase non configuré') };
    },
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true, // garde la session entre 2 ouvertures
        autoRefreshToken: true,
        // true : Supabase consomme automatiquement les hash/query params de
        // type ?code=... ou #access_token=... au chargement de la page (utile
        // pour les flows reset password, magic link et OAuth).
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : stub;
