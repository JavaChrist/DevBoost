import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sm2 } from './sm2.js';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-01-01T00:00:00Z').getTime();

test('première réussite (q=5) : interval=1, repetitions=1, EF augmente', () => {
  const r = sm2({ easeFactor: 2.5, interval: 0, repetitions: 0 }, 5, NOW);
  assert.equal(r.interval, 1);
  assert.equal(r.repetitions, 1);
  assert.ok(r.easeFactor > 2.5, `EF doit augmenter (got ${r.easeFactor})`);
  assert.equal(r.nextReview.getTime(), NOW + DAY_MS);
});

test('deuxième réussite (q=5) : interval=6, repetitions=2', () => {
  const r = sm2({ easeFactor: 2.6, interval: 1, repetitions: 1 }, 5, NOW);
  assert.equal(r.interval, 6);
  assert.equal(r.repetitions, 2);
  assert.equal(r.nextReview.getTime(), NOW + 6 * DAY_MS);
});

test('troisième réussite : interval = round(prevInterval * EF)', () => {
  const r = sm2({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 4, NOW);
  assert.equal(r.repetitions, 3);
  assert.equal(r.interval, Math.round(6 * 2.5)); // = 15
});

test('échec (q<3) : repetitions reset à 0, interval=1, EF inchangé', () => {
  const ef = 2.42;
  const r = sm2({ easeFactor: ef, interval: 15, repetitions: 3 }, 1, NOW);
  assert.equal(r.repetitions, 0);
  assert.equal(r.interval, 1);
  assert.equal(r.easeFactor, ef, 'EF inchangé sur échec');
  assert.equal(r.nextReview.getTime(), NOW + DAY_MS);
});

test('EF borné en bas à 1.3 (q=3 répété abaisse mais ne descend jamais sous 1.3)', () => {
  let card = { easeFactor: 1.4, interval: 6, repetitions: 2 };
  for (let i = 0; i < 50; i++) {
    card = sm2(card, 3, NOW);
  }
  assert.ok(card.easeFactor >= 1.3, `EF doit rester >= 1.3 (got ${card.easeFactor})`);
});

test('quality clampée et arrondie : valeurs hors [0,5] → bornes', () => {
  const a = sm2({}, 99, NOW); // → 5
  const b = sm2({}, -3, NOW); // → 0
  assert.equal(a.repetitions, 1);
  assert.equal(b.repetitions, 0);
});

test('cardvide → defaults appliqués (EF=2.5, reps=0, interval=0)', () => {
  const r = sm2({}, 5, NOW);
  assert.equal(r.repetitions, 1);
  assert.equal(r.interval, 1);
  assert.ok(r.easeFactor > 2.5);
});
