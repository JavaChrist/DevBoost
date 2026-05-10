import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-rose-500/15 ring-1 ring-rose-500/40">
        <XCircle size={36} className="text-rose-300" aria-hidden />
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Paiement annulé</h1>
        <p className="text-sm text-slate-400">
          Tu n’as pas finalisé l’abonnement, aucune somme n’a été prélevée. Tu
          peux réessayer quand tu veux depuis les Réglages.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          to="/settings"
          className="rounded-2xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-100 hover:bg-slate-700"
        >
          Retour aux Réglages
        </Link>
        <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 hover:underline">
          Retour au Dashboard
        </Link>
      </div>
    </section>
  );
}
