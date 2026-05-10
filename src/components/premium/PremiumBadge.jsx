import { Crown } from 'lucide-react';

// Petit badge "Premium" à coller sur les cours / cartes / thèmes premium.
// Sizes : 'sm' (badge mini, list), 'md' (carte/section).
export default function PremiumBadge({ size = 'sm', className = '' }) {
  const sm = size === 'sm';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider ring-1',
        sm
          ? 'bg-amber-400/15 px-1.5 py-0.5 text-[9px] text-amber-300 ring-amber-400/40'
          : 'bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300 ring-amber-400/40',
        className,
      ].join(' ')}
    >
      <Crown size={sm ? 9 : 11} aria-hidden />
      Premium
    </span>
  );
}
