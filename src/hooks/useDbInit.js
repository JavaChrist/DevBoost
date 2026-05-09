import { useEffect, useState } from 'react';
import db from '../db/dexie.js';
import { ensureSeed, syncSeed, syncCourses } from '../db/seed.js';
import { useUserStore } from '../store/useUserStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';

export function useDbInit() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const firstRun = await ensureSeed();
        if (!firstRun) await syncSeed();
        await syncCourses();
        const [user, settings] = await Promise.all([db.user.get(1), db.settings.get(1)]);
        if (cancelled) return;
        useUserStore.getState().hydrate(user);
        useSettingsStore.getState().hydrate(settings);
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}

export default useDbInit;
