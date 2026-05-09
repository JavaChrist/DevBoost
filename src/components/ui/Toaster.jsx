import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore.js';

const TONE_CLS = {
  default: 'bg-slate-800 text-slate-100 ring-slate-700',
  success: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
  error: 'bg-rose-500/15 text-rose-200 ring-rose-400/40',
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className={[
              'pointer-events-auto cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 shadow-card backdrop-blur',
              TONE_CLS[t.tone] ?? TONE_CLS.default,
            ].join(' ')}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
