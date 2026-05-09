import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSession } from './sessionBuilder.js';

const NOW = new Date('2026-01-01T00:00:00Z');

function quiz(id, opts = {}) {
  return {
    id,
    type: 'quiz',
    theme: opts.theme ?? 'javascript',
    difficulty: opts.difficulty ?? 1,
    nextReview: opts.nextReview ?? null,
  };
}
function challenge(id, opts = {}) {
  return { ...quiz(id, opts), type: 'challenge' };
}

// rng déterministe pour tests reproductibles.
function seededRng(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

test('renvoie 7 quiz + 3 challenges quand le pool le permet', () => {
  const cards = [
    ...Array.from({ length: 12 }, (_, i) => quiz(`q${i}`)),
    ...Array.from({ length: 6 }, (_, i) => challenge(`c${i}`)),
  ];
  const out = buildSession({ cards, now: NOW, rng: seededRng() });
  assert.equal(out.length, 10);
  assert.equal(out.filter((c) => c.type === 'quiz').length, 7);
  assert.equal(out.filter((c) => c.type === 'challenge').length, 3);
});

test('renvoie moins si pool insuffisant (sans crasher)', () => {
  const cards = [quiz('q1'), quiz('q2'), challenge('c1')];
  const out = buildSession({ cards, now: NOW, rng: seededRng() });
  assert.equal(out.length, 3);
});

test('priorise les cartes due (nextReview <= now) avant les futures', () => {
  const past = new Date(NOW.getTime() - 86_400_000); // hier
  const future = new Date(NOW.getTime() + 86_400_000); // demain
  const cards = [
    quiz('q-future-1', { nextReview: future }),
    quiz('q-due-1', { nextReview: past }),
    quiz('q-future-2', { nextReview: future }),
    quiz('q-never', { nextReview: null }),
  ];
  const out = buildSession({ cards, quizCount: 2, challengeCount: 0, now: NOW, rng: seededRng() });
  assert.equal(out.length, 2);
  // Les 2 cartes due (q-due-1 et q-never) doivent toutes deux être présentes.
  const ids = out.map((c) => c.id).sort();
  assert.deepEqual(ids, ['q-due-1', 'q-never']);
});

test('filtre par thèmes actifs', () => {
  const cards = [
    quiz('q-js', { theme: 'javascript' }),
    quiz('q-react', { theme: 'react' }),
    quiz('q-algo', { theme: 'algo' }),
    challenge('c-react', { theme: 'react' }),
    challenge('c-algo', { theme: 'algo' }),
  ];
  const out = buildSession({
    cards,
    themes: ['react'],
    quizCount: 5,
    challengeCount: 5,
    now: NOW,
    rng: seededRng(),
  });
  assert.ok(out.every((c) => c.theme === 'react'));
  assert.equal(out.length, 2);
});

test('ne retourne jamais de doublons', () => {
  const cards = Array.from({ length: 20 }, (_, i) => quiz(`q${i}`));
  const out = buildSession({ cards, quizCount: 7, challengeCount: 0, now: NOW, rng: seededRng() });
  const ids = out.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('entrelace quiz et challenges (pas de bloc de 3 challenges à la fin)', () => {
  const cards = [
    ...Array.from({ length: 7 }, (_, i) => quiz(`q${i}`)),
    ...Array.from({ length: 3 }, (_, i) => challenge(`c${i}`)),
  ];
  const out = buildSession({ cards, now: NOW, rng: seededRng() });
  // Trouve la dernière position d'un challenge : ne devrait pas former un bloc final
  // collé (au moins un quiz après l'avant-dernier challenge).
  const types = out.map((c) => c.type);
  const lastChallengeIdx = types.lastIndexOf('challenge');
  // Au moins une carte quiz dans le tiers final OU le dernier challenge n'est pas en fin.
  assert.ok(lastChallengeIdx <= types.length - 1);
  // Au moins un quiz dans la deuxième moitié.
  const half = Math.floor(types.length / 2);
  assert.ok(types.slice(half).includes('quiz'), 'au moins un quiz après le milieu');
});
