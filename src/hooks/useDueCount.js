import { useEffect, useState } from 'react';
import db from '../db/dexie.js';

// Cartes "due" : nextReview === null (jamais vues) OU nextReview <= now,
// limitées aux thèmes actifs. Recompté à chaque "rafraîchir".
export function useDueCount(activeThemes) {
  const [count, setCount] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await db.cards.toArray();
      if (cancelled) return;
      const now = Date.now();
      const themesSet = activeThemes ? new Set(activeThemes) : null;
      const due = all.filter((c) => {
        if (themesSet && !themesSet.has(c.theme)) return false;
        if (c.nextReview == null) return true;
        const t = c.nextReview instanceof Date ? c.nextReview.getTime() : Date.parse(c.nextReview);
        return Number.isFinite(t) ? t <= now : true;
      });
      setCount(due.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeThemes, refreshTick]);

  return { count, refresh: () => setRefreshTick((n) => n + 1) };
}

export default useDueCount;
