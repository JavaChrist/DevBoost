import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StreakBadge({ streak = 0, className = '' }) {
  const active = streak > 0;
  const prevRef = useRef(streak);
  const [bumpKey, setBumpKey] = useState(0);

  // Détecte une augmentation pour déclencher l'animation.
  useEffect(() => {
    if (streak > prevRef.current) setBumpKey((k) => k + 1);
    prevRef.current = streak;
  }, [streak]);

  return (
    <span
      className={[
        'relative inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold',
        active ? 'bg-amber-400/15 text-amber-400' : 'bg-slate-800 text-slate-400',
        className,
      ].join(' ')}
      aria-label={`Streak ${streak} jours`}
    >
      <motion.span
        key={`flame-${bumpKey}`}
        className={active ? 'animate-flame' : ''}
        initial={bumpKey === 0 ? false : { scale: 1.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        aria-hidden
      >
        🔥
      </motion.span>
      <motion.span
        key={`num-${streak}`}
        initial={bumpKey === 0 ? false : { y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {streak}
      </motion.span>

      {/* Petit "+1 🔥" qui flotte vers le haut quand le streak monte */}
      <AnimatePresence>
        {bumpKey > 0 && (
          <motion.span
            key={bumpKey}
            initial={{ opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -28, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute -top-2 right-0 text-xs font-extrabold text-amber-300"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
