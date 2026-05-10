import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSubscriptionStore, usePremium } from '../store/useSubscriptionStore.js';

// Page d'atterrissage après le checkout Mollie. Mollie renvoie ici
// SANS attendre que le webhook ait fini de traiter le paiement, donc
// on poll la subscription pendant ~10s pour récupérer son nouvel état.
export default function PaymentSuccess() {
  const user = useAuthStore((s) => s.user);
  const refresh = useSubscriptionStore((s) => s.refresh);
  const { isPremium, label } = usePremium();
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setPolling(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      const sub = await refresh(user.id);
      if (sub?.status === 'active' || attempts >= 10) {
        setPolling(false);
        return;
      }
      setTimeout(tick, 1500);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [user?.id, refresh]);

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/40">
        {polling && !isPremium ? (
          <Loader2 size={32} className="animate-spin text-amber-300" aria-hidden />
        ) : isPremium ? (
          <Check size={36} className="text-amber-300" aria-hidden />
        ) : (
          <Crown size={32} className="text-amber-300" aria-hidden />
        )}
      </div>

      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {isPremium ? 'Bienvenue Premium !' : 'Paiement reçu'}
        </h1>
        <p className="text-sm text-slate-400">
          {polling && !isPremium
            ? 'On finalise ton abonnement, ça prend quelques secondes…'
            : isPremium
              ? 'Tu as désormais accès à tout le contenu Premium. Bonne progression !'
              : 'Le paiement a bien été reçu. Si ton statut ne s’est pas mis à jour dans 1 minute, ouvre les Réglages.'}
        </p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          Retour au Dashboard
        </Link>
        <Link to="/settings" className="text-xs text-slate-500 hover:text-slate-300 hover:underline">
          Voir mes Réglages
        </Link>
      </div>
    </section>
  );
}
