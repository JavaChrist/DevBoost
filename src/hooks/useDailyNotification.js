import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore.js';
import {
  getPermission,
  isNotificationSupported,
  nextOccurrenceAt,
  showNotification,
} from '../lib/notifications.js';

// Tant que l'app est ouverte (onglet actif ou PWA en arrière-plan sur desktop),
// planifie la prochaine notif via setTimeout. Ré-planifie après chaque tir.
export default function useDailyNotification() {
  const notifyAt = useSettingsStore((s) => s.notifyAt);

  useEffect(() => {
    if (!notifyAt || !isNotificationSupported() || getPermission() !== 'granted') return;

    let timer = null;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const ts = nextOccurrenceAt(notifyAt);
      if (ts == null) return;
      const delay = Math.max(1000, ts - Date.now());
      timer = setTimeout(() => {
        if (cancelled) return;
        showNotification('DevBoost — session du jour 🔥', {
          body: 'Une session t’attend pour garder ton streak.',
          tag: 'devboost-daily',
        });
        schedule(); // re-plan pour le lendemain
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [notifyAt]);
}
