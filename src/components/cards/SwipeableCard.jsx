// Wrap n'importe quel children dans une carte drag horizontale (Tinder-like).
// - Drag à droite >  threshold → onSwipeRight (= "OK", quality 4)
// - Drag à gauche < -threshold → onSwipeLeft  (= "À revoir", quality 2)
// - Sortie animée (translateX + rotate + fade)
// - Indicateurs visuels OK / À REVOIR qui apparaissent en fonction de l'offset
// - Drag désactivé si l'éditeur CodeMirror a le focus (évite le conflit avec
//   les sélections de texte / horizontal scroll dans le code).

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';
import useSwipe from '../../hooks/useSwipe.js';
import { vibrate } from '../../lib/feedback.js';
import { useSettingsStore } from '../../store/useSettingsStore.js';

const THRESHOLD = 120;

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  exitDirection = 0, // -1 (gauche), +1 (droite), 0 (rien) — défini par le parent à l'exit
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const okOpacity = useTransform(x, [40, THRESHOLD], [0, 1]);
  const retryOpacity = useTransform(x, [-THRESHOLD, -40], [1, 0]);

  const handleDragEnd = useSwipe({
    onSwipeLeft: () => {
      if (useSettingsStore.getState().haptic) vibrate(20);
      onSwipeLeft?.();
    },
    onSwipeRight: () => {
      if (useSettingsStore.getState().haptic) vibrate(20);
      onSwipeRight?.();
    },
    threshold: THRESHOLD,
  });

  // Si on quitte vers la droite ou la gauche, on amplifie via exitDirection
  // (la velocity garde un peu de naturel). Sinon retour au centre.
  const exitX = exitDirection === 0 ? 0 : exitDirection * 600;

  return (
    <motion.div
      className="relative w-full touch-pan-y"
      drag="x"
      dragElastic={0.6}
      dragMomentum={false}
      dragDirectionLock
      style={{ x, rotate }}
      onDragEnd={(event, info) => {
        // Si on est dans l'éditeur CodeMirror, on annule le swipe.
        const target = event.target;
        if (
          target instanceof Element &&
          (target.closest('.cm-editor') || target.closest('[data-no-swipe]'))
        ) {
          x.set(0);
          return;
        }
        handleDragEnd(event, info);
      }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      exit={{
        x: exitX,
        rotate: exitDirection * 18,
        opacity: 0,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      {/* Indicateurs overlay */}
      <motion.span
        aria-hidden
        style={{ opacity: okOpacity }}
        className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg border-2 border-emerald-400 bg-emerald-500/10 px-3 py-1 text-sm font-extrabold uppercase tracking-widest text-emerald-300 shadow-lg"
      >
        OK <Check size={16} strokeWidth={3} />
      </motion.span>
      <motion.span
        aria-hidden
        style={{ opacity: retryOpacity }}
        className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg border-2 border-rose-400 bg-rose-500/10 px-3 py-1 text-sm font-extrabold uppercase tracking-widest text-rose-300 shadow-lg"
      >
        <X size={16} strokeWidth={3} /> À revoir
      </motion.span>

      {children}
    </motion.div>
  );
}
