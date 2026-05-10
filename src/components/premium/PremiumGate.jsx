import { useState } from 'react';
import { Crown, Lock } from 'lucide-react';
import { usePremium } from '../../store/useSubscriptionStore.js';
import Paywall from './Paywall.jsx';

// Wrapper conditionnel : affiche children si l'utilisateur est Premium,
// sinon un overlay verrouillé qui ouvre la modal Paywall au clic.
//
// Usage :
//   <PremiumGate locked={isCoursePremium(course)} reason="Ce cours est Premium">
//     <CourseContent />
//   </PremiumGate>
export default function PremiumGate({ locked, children, reason, className = '' }) {
  const { isPremium } = usePremium();
  const [open, setOpen] = useState(false);

  if (!locked || isPremium) return children;

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-950/70 backdrop-blur-sm transition-colors hover:bg-slate-950/80"
        >
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40">
              <Lock size={20} aria-hidden />
            </div>
            <p className="text-sm font-bold text-slate-100">Contenu Premium</p>
            <p className="max-w-xs text-[11px] text-slate-400">{reason}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/40">
              <Crown size={12} aria-hidden />
              Débloquer
            </span>
          </div>
        </button>
      </div>
      <Paywall open={open} onClose={() => setOpen(false)} reason={reason} />
    </>
  );
}
