import { useState } from 'react';
import usePWAInstall from '../../hooks/usePWAInstall.js';

const DISMISS_KEY = 'devboost.install.dismissed';

export default function InstallPrompt() {
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (installed || dismissed || !canInstall) return null;

  const onDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const onInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'dismissed') onDismiss();
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/30">
      <span aria-hidden className="text-2xl">
        📱
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-emerald-200">Installer DevBoost</p>
        <p className="text-xs text-emerald-200/70">
          Ajoute l’app à ton écran d’accueil pour t’entraîner offline.
        </p>
      </div>
      <button
        type="button"
        onClick={onInstall}
        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
      >
        Installer
      </button>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onDismiss}
        className="rounded-lg p-1 text-slate-400 hover:text-slate-200"
      >
        ✕
      </button>
    </div>
  );
}
