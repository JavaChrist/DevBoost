// Algo SuperMemo-2 (~30 lignes).
// Réf : https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
//
// quality ∈ [0, 5]
//   0–2 : raté → on repart à 0, intervalle = 1 jour, easeFactor inchangé
//   3–5 : réussi → on incrémente repetitions, intervalle = f(reps, EF), EF mis à jour
//
// EF est borné en bas à 1.3 (norme SM-2).

const DAY_MS = 86_400_000;

export function sm2(card = {}, quality, now = Date.now()) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card;
  const q = clampQuality(quality);

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );
  }

  const nextReview = new Date(now + interval * DAY_MS);
  return { easeFactor, interval, repetitions, nextReview };
}

function clampQuality(q) {
  const n = Number(q);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

// Mapping pratique pour le swipe : OK/à revoir → quality.
// Configurable plus tard depuis Settings si besoin.
export const SWIPE_QUALITY = {
  ok: 4, // swipe droite
  retry: 2, // swipe gauche
};

export default sm2;
