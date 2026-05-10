// DevBoost — interactions client avec le système d'abonnement.
//
// La table subscriptions est en lecture seule côté client (RLS bloque
// les écritures). Toute modification passe par :
//   - RPC start_free_trial() pour démarrer le mois gratuit
//   - Edge Functions pour Mollie (create-subscription, cancel)
//
// La donnée subscription est synchronisée dans IndexedDB via cloudSync
// pour rester accessible offline (utile pour le gating sans réseau).

import { supabase, isSupabaseConfigured } from './supabase.js';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function rowToSubscription(r) {
  if (!r) return null;
  return {
    userId: r.user_id,
    status: r.status,
    plan: r.plan,
    trialStartedAt: r.trial_started_at,
    trialEndsAt: r.trial_ends_at,
    currentPeriodStartedAt: r.current_period_started_at,
    currentPeriodEndsAt: r.current_period_ends_at,
    cancelledAt: r.cancelled_at,
    mollieCustomerId: r.mollie_customer_id,
    mollieSubscriptionId: r.mollie_subscription_id,
    trialUsed: r.trial_used,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------

export async function fetchSubscription(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return rowToSubscription(data);
}

// ---------------------------------------------------------------
// Mutations (via RPC ou Edge Functions)
// ---------------------------------------------------------------

export async function startFreeTrial() {
  if (!isSupabaseConfigured) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.rpc('start_free_trial');
  if (error) throw error;
  // La RPC renvoie une ligne (RECORD) — on la map.
  const row = Array.isArray(data) ? data[0] : data;
  return rowToSubscription(row);
}

// Appelle l'Edge Function create-subscription. Retourne l'URL de
// checkout Mollie vers laquelle rediriger l'utilisateur.
export async function createCheckout({ returnUrl, cancelUrl } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: { returnUrl, cancelUrl },
  });
  if (error) throw new Error(error.message || 'Erreur Mollie checkout.');
  if (!data?.checkoutUrl) throw new Error('Réponse Mollie invalide.');
  return data;
}

export async function cancelSubscription() {
  if (!isSupabaseConfigured) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: {},
  });
  if (error) throw new Error(error.message || "Échec de l'annulation.");
  return data;
}

// ---------------------------------------------------------------
// Helpers d'état (purs, testables)
// ---------------------------------------------------------------

export function deriveStatus(sub) {
  if (!sub) {
    return {
      isPremium: false,
      isTrialing: false,
      canStartTrial: true,
      daysLeft: 0,
      label: 'Gratuit',
      effectiveStatus: 'free',
    };
  }

  const now = Date.now();
  const trialEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : 0;
  const periodEnd = sub.currentPeriodEndsAt
    ? new Date(sub.currentPeriodEndsAt).getTime()
    : 0;

  const trialActive = sub.status === 'trialing' && trialEnd > now;
  const subActive =
    sub.status === 'active' && (!periodEnd || periodEnd > now);
  const cancelledButValid =
    sub.status === 'cancelled' && periodEnd > now;

  const isPremium = trialActive || subActive || cancelledButValid;

  let label = 'Gratuit';
  let daysLeft = 0;
  if (trialActive) {
    daysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86_400_000));
    label = `Essai gratuit · J-${daysLeft}`;
  } else if (subActive) {
    daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd - now) / 86_400_000)) : null;
    label = 'Premium actif';
  } else if (cancelledButValid) {
    daysLeft = Math.max(0, Math.ceil((periodEnd - now) / 86_400_000));
    label = `Annulé · prend fin dans ${daysLeft} j`;
  } else if (sub.status === 'expired') {
    label = 'Essai terminé';
  } else if (sub.status === 'cancelled') {
    label = 'Annulé';
  }

  return {
    isPremium,
    isTrialing: trialActive,
    canStartTrial: !sub.trialUsed,
    daysLeft,
    label,
    effectiveStatus: isPremium ? 'premium' : sub.status || 'free',
  };
}
