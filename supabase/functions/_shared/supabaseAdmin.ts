// Helpers Supabase pour Edge Functions :
// - getUserFromRequest : extrait l'user authentifié depuis le header Authorization
// - adminClient : client avec service_role pour bypass RLS (écritures privilégiées)
//
// IMPORTANT : SUPABASE_SERVICE_ROLE_KEY ne doit JAMAIS être exposée côté
// front. Elle vit uniquement dans les variables Supabase Edge Functions.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} env var manquante`);
  return v;
}

export function adminClient(): SupabaseClient {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  // On utilise la clé anon ici juste pour décoder le JWT (auth.getUser).
  const userClient = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
