// Tirage d'une session : 7 quiz + 3 challenges par défaut.
// Stratégie :
//   1. Filtre par thèmes actifs.
//   2. Pour chaque type (quiz, challenge) :
//      a. Cartes "due" d'abord (nextReview === null OU <= now), triées par ancienneté
//         (les plus en retard en premier).
//      b. Si le quota n'est pas atteint, on complète avec un tirage aléatoire pondéré
//         par 1 / difficulty (les cartes faciles légèrement plus fréquentes).
//   3. On entrelace quiz + challenges pour casser la monotonie.

export function buildSession({
  cards = [],
  quizCount = 7,
  challengeCount = 3,
  themes = null, // null = pas de filtre
  now = new Date(),
  rng = Math.random,
} = {}) {
  const t = now instanceof Date ? now.getTime() : Number(now);

  const filtered = themes ? cards.filter((c) => themes.includes(c.theme)) : cards;

  const quizzes = pick(filtered.filter((c) => c.type === 'quiz'), quizCount, t, rng);
  const challenges = pick(
    filtered.filter((c) => c.type === 'challenge'),
    challengeCount,
    t,
    rng,
  );

  return interleave(quizzes, challenges);
}

function pick(pool, count, nowMs, rng) {
  if (count <= 0 || pool.length === 0) return [];

  const due = [];
  const future = [];
  for (const c of pool) {
    if (isDue(c, nowMs)) due.push(c);
    else future.push(c);
  }
  due.sort((a, b) => dueScore(a, nowMs) - dueScore(b, nowMs)); // plus en retard d'abord

  const picked = due.slice(0, count);
  if (picked.length >= count) return picked;

  // Complète avec un tirage pondéré sans remise dans `future`.
  const remainingNeeded = count - picked.length;
  picked.push(...weightedSample(future, remainingNeeded, rng));
  return picked;
}

function isDue(card, nowMs) {
  if (card.nextReview == null) return true;
  const t = card.nextReview instanceof Date ? card.nextReview.getTime() : Date.parse(card.nextReview);
  return Number.isFinite(t) ? t <= nowMs : true;
}

function dueScore(card, nowMs) {
  if (card.nextReview == null) return -Infinity; // jamais vue → tout en haut
  const t = card.nextReview instanceof Date ? card.nextReview.getTime() : Date.parse(card.nextReview);
  return Number.isFinite(t) ? t - nowMs : -Infinity;
}

// Tirage sans remise pondéré par 1 / difficulty.
function weightedSample(pool, k, rng) {
  if (k <= 0 || pool.length === 0) return [];
  const items = [...pool];
  const result = [];

  for (let n = 0; n < k && items.length > 0; n++) {
    const weights = items.map((c) => 1 / Math.max(1, Number(c.difficulty) || 1));
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < items.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    if (idx >= items.length) idx = items.length - 1;
    result.push(items.splice(idx, 1)[0]);
  }
  return result;
}

// Round-robin pour mélanger quiz/challenge sans clusterer 3 challenges à la fin.
function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  // Ratio (a:b) : on insère b une fois tous les step quiz.
  const step = a.length === 0 ? 1 : Math.max(1, Math.round(a.length / Math.max(1, b.length)));
  let bi = 0;
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (bi < b.length && (i + 1) % step === 0) out.push(b[bi++]);
  }
  while (bi < b.length) out.push(b[bi++]);
  return out;
}

export default buildSession;
