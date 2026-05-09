// Calculs de streak quotidien — fonctions pures, indépendantes du fuseau (jour local).

const DAY_MS = 86_400_000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function diffInDays(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}

// Renvoie le nouveau streak après une session terminée à `today`.
// - jamais joué → 1
// - déjà joué aujourd'hui → inchangé (anti double-comptage)
// - joué hier → +1
// - sinon (≥ 2 jours d'écart) → reset à 1
export function nextStreak({ currentStreak = 0, lastSessionDate = null, today = new Date() } = {}) {
  if (!lastSessionDate) return Math.max(1, 1);
  const last = new Date(lastSessionDate);
  if (Number.isNaN(last.getTime())) return 1;

  const delta = diffInDays(last, today);
  if (delta === 0) return Math.max(1, currentStreak); // déjà compté aujourd'hui
  if (delta === 1) return currentStreak + 1;
  return 1;
}

export default nextStreak;
