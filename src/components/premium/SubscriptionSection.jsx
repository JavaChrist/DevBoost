import { useState } from 'react';
import { Crown, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useSubscriptionStore, usePremium } from '../../store/useSubscriptionStore.js';
import { startFreeTrial, cancelSubscription } from '../../lib/subscription.js';
import { toast } from '../../store/useToastStore.js';
import Paywall from './Paywall.jsx';

// Section "Abonnement" affichée dans Settings : statut courant + CTA
// adaptés (démarrer essai, s'abonner, gérer, résilier).
export default function SubscriptionSection() {
  const user = useAuthStore((s) => s.user);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const sub = useSubscriptionStore((s) => s.subscription);
  const loading = useSubscriptionStore((s) => s.loading);
  const { isPremium, isTrialing, canStartTrial, daysLeft, label } = usePremium();
  const [paywall, setPaywall] = useState(false);
  const [busy, setBusy] = useState(null);

  const handleTrial = async () => {
    if (!user?.id || busy) return;
    setBusy('trial');
    try {
      const result = await startFreeTrial();
      setSubscription(result);
      toast.success('Mois gratuit activé !');
    } catch (err) {
      toast.error(err.message || "Impossible d'activer l'essai");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!user?.id || busy) return;
    if (!window.confirm("Annuler l'abonnement ? L'accès Premium reste actif jusqu'à la fin de la période payée.")) {
      return;
    }
    setBusy('cancel');
    try {
      await cancelSubscription();
      await refresh(user.id);
      toast.success('Abonnement annulé');
    } catch (err) {
      toast.error(err.message || "Échec de l'annulation");
    } finally {
      setBusy(null);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id || busy) return;
    setBusy('refresh');
    try {
      await refresh(user.id);
      toast.show('Abonnement actualisé');
    } finally {
      setBusy(null);
    }
  };

  const status = sub?.status ?? 'free';
  const accent = isPremium
    ? 'bg-amber-400/10 ring-amber-400/30 text-amber-200'
    : 'bg-slate-950/40 ring-slate-800 text-slate-300';

  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-100">
          <Crown size={16} className="text-amber-300" aria-hidden />
          Abonnement
        </h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={busy === 'refresh' || !user?.id}
          aria-label="Actualiser"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
        >
          <RefreshCw size={14} className={busy === 'refresh' ? 'animate-spin' : ''} aria-hidden />
        </button>
      </div>

      {loading && !sub ? (
        <div className="grid place-items-center py-4 text-slate-500">
          <Loader2 size={18} className="animate-spin" aria-hidden />
        </div>
      ) : (
        <>
          <div className={`mb-3 rounded-xl px-3 py-2 ring-1 ${accent}`}>
            <p className="text-xs font-semibold">{label}</p>
            {isPremium && daysLeft !== null && daysLeft > 0 && (
              <p className="text-[10px] opacity-70">
                {isTrialing
                  ? `Fin de l'essai dans ${daysLeft} j`
                  : `Prochain renouvellement dans ${daysLeft} j`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {!isPremium && canStartTrial && (
              <Button
                variant="primary"
                size="md"
                onClick={handleTrial}
                disabled={!!busy}
                className="w-full"
              >
                {busy === 'trial' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Activation…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} aria-hidden />
                    Démarrer mon mois gratuit
                  </>
                )}
              </Button>
            )}

            {!isPremium && !canStartTrial && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setPaywall(true)}
                disabled={!!busy}
                className="w-full"
              >
                <Crown size={16} aria-hidden />
                S’abonner — 4,99 €/mois
              </Button>
            )}

            {isPremium && status === 'active' && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleCancel}
                disabled={!!busy}
                className="w-full ring-1 ring-rose-500/30 text-rose-300 hover:bg-rose-500/10"
              >
                {busy === 'cancel' ? 'Annulation…' : 'Résilier mon abonnement'}
              </Button>
            )}

            {isPremium && status === 'trialing' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setPaywall(true)}
                disabled={!!busy}
                className="w-full"
              >
                <Crown size={16} aria-hidden />
                Continuer en Premium après l’essai
              </Button>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            DevBoost Premium débloque le thème IA et les cours niveau
            avancé. Annulable à tout moment, paiement sécurisé via Mollie.
          </p>
        </>
      )}

      <Paywall open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}
