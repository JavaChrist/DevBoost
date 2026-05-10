// DevBoost — règles de gating Premium.
//
// Centralise la définition de ce qui est "premium" pour pouvoir la
// modifier sans toucher aux 24 cours / 96 cartes individuellement.
//
// Règles actuelles :
// - Thème "ia" : intégralement Premium (cours + cartes)
// - Cours niveau >= 3 : Premium (peu importe le thème)
// - Tout le reste : Gratuit (et reste libre quoi qu'il arrive)

const PREMIUM_THEMES = new Set(['ia']);
const PREMIUM_LEVEL_THRESHOLD = 3;

export function isCoursePremium(course) {
  if (!course) return false;
  if (PREMIUM_THEMES.has(course.theme)) return true;
  const level = course.level ?? 1;
  return level >= PREMIUM_LEVEL_THRESHOLD;
}

export function isCardPremium(card) {
  if (!card) return false;
  return PREMIUM_THEMES.has(card.theme);
}

export function isThemePremium(theme) {
  return PREMIUM_THEMES.has(theme);
}

export const PREMIUM_RULES = {
  themes: Array.from(PREMIUM_THEMES),
  courseLevelThreshold: PREMIUM_LEVEL_THRESHOLD,
};
