// Calculs statistiques purs sur les sessions et reviews — testables sans DOM.

const DAY_MS = 86_400_000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function dayKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Renvoie { current, max } depuis la liste des sessions (chaque session a une `date`).
// Une journée avec ≥ 1 session compte pour 1.
export function computeStreaks(sessions = [], today = new Date()) {
  if (sessions.length === 0) return { current: 0, max: 0 };

  const days = Array.from(
    new Set(sessions.map((s) => startOfDay(s.date))),
  ).sort((a, b) => a - b);

  // Max streak : plus longue séquence de jours consécutifs.
  let max = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === DAY_MS) run += 1;
    else run = 1;
    if (run > max) max = run;
  }

  // Current streak : remonte depuis aujourd'hui (ou hier).
  const todayMs = startOfDay(today);
  const lastDay = days[days.length - 1];
  let current = 0;
  if (lastDay === todayMs || lastDay === todayMs - DAY_MS) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i + 1] - days[i] === DAY_MS) current += 1;
      else break;
    }
  }

  return { current, max };
}

// Renvoie un tableau de N jours (du plus ancien au plus récent) :
//   [{ key:'YYYY-MM-DD', date: Date, sessions: n, cards: k, passed: p }]
export function dailySessions(sessions = [], days = 30, today = new Date()) {
  const todayStart = startOfDay(today);
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayStart - i * DAY_MS;
    const k = dayKey(ts);
    buckets.set(k, { key: k, date: new Date(ts), sessions: 0, cards: 0, passed: 0 });
  }
  for (const s of sessions) {
    const k = dayKey(s.date);
    const b = buckets.get(k);
    if (!b) continue;
    b.sessions += 1;
    b.cards += Number(s.cardsCount) || 0;
    b.passed += Number(s.passed) || 0;
  }
  return Array.from(buckets.values());
}

// Renvoie [{ theme, total, passed, ratio }] trié par total desc.
export function themeStats(reviews = [], cards = []) {
  const themeOf = new Map(cards.map((c) => [c.id, c.theme]));
  const acc = new Map();
  for (const r of reviews) {
    const theme = themeOf.get(r.cardId);
    if (!theme) continue;
    const e = acc.get(theme) ?? { theme, total: 0, passed: 0 };
    e.total += 1;
    if (Number(r.quality) >= 3) e.passed += 1;
    acc.set(theme, e);
  }
  return Array.from(acc.values())
    .map((e) => ({ ...e, ratio: e.total > 0 ? e.passed / e.total : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function aggregate(sessions = [], reviews = []) {
  const totalSessions = sessions.length;
  const totalCards = sessions.reduce((s, x) => s + (Number(x.cardsCount) || 0), 0);
  const totalPassed = sessions.reduce((s, x) => s + (Number(x.passed) || 0), 0);
  const reviewPass = reviews.filter((r) => Number(r.quality) >= 3).length;
  const successRate = reviews.length > 0 ? reviewPass / reviews.length : 0;
  return { totalSessions, totalCards, totalPassed, totalReviews: reviews.length, successRate };
}
