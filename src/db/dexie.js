import Dexie from 'dexie';

export const db = new Dexie('devboost');

db.version(1).stores({
  cards: '++id, theme, type, difficulty, lastReview',
  reviews: '++id, cardId, date, quality, easeFactor, interval, nextReview',
  sessions: '++id, date, durationSec, cardsCount, passed',
  user: 'id, xp, streak, lastSessionDate, unlockedThemes',
  settings: 'id, sessionDuration, themes, notifyAt',
});

// v2 : ajout de la rubrique Cours.
db.version(2).stores({
  cards: '++id, theme, type, difficulty, lastReview',
  reviews: '++id, cardId, date, quality, easeFactor, interval, nextReview',
  sessions: '++id, date, durationSec, cardsCount, passed',
  user: 'id, xp, streak, lastSessionDate, unlockedThemes',
  settings: 'id, sessionDuration, themes, notifyAt',
  courses: '++id, &slug, theme, level',
  courseProgress: 'slug, lastSection, completed, completedAt',
});

export default db;
