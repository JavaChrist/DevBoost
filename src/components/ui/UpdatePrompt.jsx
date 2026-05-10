import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

// Affiche un toast persistant quand une nouvelle version du Service Worker
// est prête. Au clic sur "Recharger", on appelle updateSW() qui active le
// nouveau SW puis recharge la page.
//
// On utilise dynamic import pour `virtual:pwa-register` car ce module n'existe
// qu'en runtime (injecté par vite-plugin-pwa). En dev sans PWA activée, l'import
// peut échouer silencieusement → le composant ne fait alors rien, comportement OK.
export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let interval;

    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (cancelled) return;
        const update = registerSW({
          immediate: true,
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            // Première installation : pas besoin de prompt, l'app est prête.
          },
        });
        setUpdateSW(() => update);

        // Vérifie périodiquement la présence d'une nouvelle version (toutes les 30 min).
        interval = setInterval(() => update(true).catch(() => {}), 30 * 60 * 1000);
      })
      .catch(() => {
        /* PWA non disponible (mode dev sans plugin) → noop */
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    if (updateSW) updateSW(true).catch(() => window.location.reload());
    else window.location.reload();
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-emerald-500/95 p-3 text-slate-950 shadow-card ring-1 ring-emerald-400 backdrop-blur"
          role="status"
          aria-live="polite"
        >
          <RefreshCw size={18} aria-hidden className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Nouvelle version disponible</p>
            <p className="text-[11px] opacity-80">Recharge pour profiter des améliorations.</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-slate-900"
          >
            Recharger
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            aria-label="Fermer"
            className="shrink-0 rounded-md p-1 text-slate-950/70 hover:bg-slate-950/10"
          >
            <X size={16} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
