import { useState } from 'react';
import { Crown, Check, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { toast } from '../../store/useToastStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useSubscriptionStore, usePremium } from '../../store/useSubscriptionStore.js';
import { startFreeTrial, createCheckout } from '../../lib/subscription.js';

// Paywall : modal proposant l'essai gratuit ou l'abonnement payant.
// Réutilisable depuis n'importe où (gating cours, gating thème, etc.).
export default function Paywall({ open, onClose, reason }) {
  const user = useAuthStore((s) => s.user);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const { canStartTrial, isTrialing, isPremium } = usePremium();
  const [busy, setBusy] = useState(null); // 'trial' | 'pay' | null

  const handleTrial = async () => {
    if (!user?.id || busy) return;
    setBusy('trial');
    try {
      const sub = await startFreeTrial();
      setSubscription(sub);
      toast.success('Mois gratuit activé. Profite bien !');
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Impossible d'activer l'essai");
    } finally {
      setBusy(null);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id || busy) return;
    setBusy('pay');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { checkoutUrl } = await createCheckout({
        returnUrl: `${origin}/payment-success`,
        cancelUrl: `${origin}/payment-cancel`,
      });
      // Refresh juste avant de partir, au cas où.
      if (user?.id) refresh(user.id);
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(err.message || 'Impossible de démarrer le paiement');
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Passe à DevBoost Premium">
      <div className="space-y-4 text-sm">
        {reason && (
          <p className="rounded-xl bg-slate-950/50 p-3 text-xs text-slate-400 ring-1 ring-slate-800">
            {reason}
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-transparent p-4 ring-1 ring-amber-400/30"
        >
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-300" aria-hidden />
            <h3 className="text-base font-extrabold tracking-tight text-amber-200">
              4,99 € / mois
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-amber-200/70">
            Annulable à tout moment. TVA incluse.
          </p>
        </motion.div>

        <ul className="space-y-2 text-slate-300">
          <Feature>Tous les cours niveau avancé (3 et 4)</Feature>
          <Feature>Le thème complet « IA &amp; agents »</Feature>
          <Feature>Sync cloud illimitée multi-appareils</Feature>
          <Feature>Soutiens un projet indépendant 🤍</Feature>
        </ul>

        {isPremium ? (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-300 ring-1 ring-emerald-500/30">
            Tu es déjà Premium {isTrialing && '(en essai gratuit)'}.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {canStartTrial && (
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
            <Button
              variant={canStartTrial ? 'secondary' : 'primary'}
              size="md"
              onClick={handleSubscribe}
              disabled={!!busy}
              className="w-full"
            >
              {busy === 'pay' ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Redirection…
                </>
              ) : (
                <>
                  <Crown size={16} aria-hidden />
                  S’abonner maintenant
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-600">
          Paiement sécurisé via Mollie · Pas de carte bancaire requise pour
          l’essai gratuit.
        </p>
      </div>
    </Modal>
  );
}

function Feature({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
      <span className="text-xs">{children}</span>
    </li>
  );
}
