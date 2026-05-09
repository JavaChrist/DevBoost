import db from './dexie.js';
import javascriptCards from '../data/cards/javascript.json';
import reactCards from '../data/cards/react.json';
import algoCards from '../data/cards/algo.json';
import htmlCards from '../data/cards/html.json';
import cssCards from '../data/cards/css.json';
import iaCards from '../data/cards/ia.json';
import htmlCourses from '../data/courses/html.json';
import cssCourses from '../data/courses/css.json';
import jsCourses from '../data/courses/javascript.json';
import reactCourses from '../data/courses/react.json';
import algoCourses from '../data/courses/algo.json';
import iaCourses from '../data/courses/ia.json';
import { withSm2Defaults, KNOWN_THEMES } from '../lib/cards.js';
import { syncCourses as syncCoursesLib } from '../lib/courses.js';

const DEFAULT_USER = {
  id: 1,
  xp: 0,
  streak: 0,
  lastSessionDate: null,
  unlockedThemes: KNOWN_THEMES,
};

const DEFAULT_SETTINGS = {
  id: 1,
  sessionDuration: 5,
  themes: KNOWN_THEMES,
  notifyAt: null,
  sound: false,
  haptic: true,
};

// Champs ré-injectés depuis le seed sans toucher au progrès SM-2.
const CONTENT_FIELDS = [
  'question',
  'choices',
  'answer',
  'explanation',
  'prompt',
  'starterCode',
  'tests',
  'hint',
  'difficulty',
  'type',
  'theme',
];

function pickContent(card) {
  const out = {};
  for (const k of CONTENT_FIELDS) {
    if (card[k] !== undefined) out[k] = card[k];
  }
  return out;
}

function seedKey(card) {
  // Identifiant stable entre 2 builds : thème + (question || prompt).
  return `${card.theme}::${card.question ?? card.prompt ?? ''}`;
}

const ALL_SEED = [
  ...htmlCards,
  ...cssCards,
  ...javascriptCards,
  ...reactCards,
  ...algoCards,
  ...iaCards,
];

const ALL_COURSES = [
  ...htmlCourses,
  ...cssCourses,
  ...jsCourses,
  ...reactCourses,
  ...algoCourses,
  ...iaCourses,
];

export async function syncCourses() {
  return syncCoursesLib(db, ALL_COURSES);
}

// Crée la base au tout 1er démarrage.
export async function ensureSeed() {
  const existingUser = await db.user.get(1);
  if (existingUser) return false;

  const cards = ALL_SEED.map(withSm2Defaults);

  await db.transaction('rw', [db.cards, db.user, db.settings], async () => {
    await db.cards.bulkAdd(cards);
    await db.user.put(DEFAULT_USER);
    await db.settings.put(DEFAULT_SETTINGS);
  });

  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[seed] DevBoost initialisé avec ${cards.length} cartes.`);
  }
  return true;
}

// Synchronise le contenu seed avec la DB sans toucher au progrès SM-2.
// - cartes existantes (même theme + question/prompt) → contenu mis à jour
// - cartes nouvelles → ajoutées avec defaults SM-2
// Aucune carte n'est supprimée (l'utilisateur peut avoir fait du custom).
export async function syncSeed() {
  const existing = await db.cards.toArray();
  const byKey = new Map(existing.map((c) => [seedKey(c), c]));

  let updated = 0;
  let added = 0;

  await db.transaction('rw', db.cards, async () => {
    for (const seedCard of ALL_SEED) {
      const key = seedKey(seedCard);
      const dbCard = byKey.get(key);
      if (dbCard) {
        const patch = pickContent(seedCard);
        await db.cards.update(dbCard.id, patch);
        updated++;
      } else {
        await db.cards.add(withSm2Defaults(seedCard));
        added++;
      }
    }
  });

  if (import.meta.env?.DEV && (added > 0 || updated > 0)) {
    // eslint-disable-next-line no-console
    console.info(`[seed] sync : ${updated} mises à jour, ${added} ajouts.`);
  }
  return { updated, added };
}

export async function resetDatabase() {
  await db.delete();
  await db.open();
}

export default ensureSeed;
