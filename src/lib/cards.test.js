import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCard, parseImport, withSm2Defaults, emptyCard } from './cards.js';

test('withSm2Defaults : applique les defaults sans écraser les valeurs existantes', () => {
  const c = withSm2Defaults({ id: 1, theme: 'js', easeFactor: 1.8 });
  assert.equal(c.easeFactor, 1.8);
  assert.equal(c.interval, 0);
  assert.equal(c.repetitions, 0);
  assert.equal(c.nextReview, null);
});

test('validateCard : quiz valide passe', () => {
  const r = validateCard({
    theme: 'javascript',
    type: 'quiz',
    question: 'Q',
    choices: ['a', 'b'],
    answer: 1,
    difficulty: 2,
  });
  assert.ok(r.ok, r.errors.join(' | '));
});

test('validateCard : challenge valide passe', () => {
  const r = validateCard({
    theme: 'algo',
    type: 'challenge',
    prompt: 'P',
    starterCode: 'function s(){}',
    tests: [{ label: 't', input: [], expected: 1 }],
    difficulty: 1,
  });
  assert.ok(r.ok, r.errors.join(' | '));
});

test('validateCard : answer hors bornes → fail', () => {
  const r = validateCard({
    theme: 'js',
    type: 'quiz',
    question: 'Q',
    choices: ['a', 'b'],
    answer: 5,
    difficulty: 1,
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /answer/);
});

test('validateCard : type inconnu → fail', () => {
  const r = validateCard({ theme: 'js', type: 'foo', difficulty: 1 });
  assert.equal(r.ok, false);
});

test('parseImport : JSON invalide', () => {
  const r = parseImport('{not json');
  assert.equal(r.cards.length, 0);
  assert.equal(r.errors.length, 1);
});

test('parseImport : tableau valide → cards avec defaults SM-2', () => {
  const r = parseImport(
    JSON.stringify([
      { theme: 'js', type: 'quiz', question: 'Q', choices: ['a', 'b'], answer: 0, difficulty: 1 },
    ]),
  );
  assert.equal(r.errors.length, 0);
  assert.equal(r.cards.length, 1);
  assert.equal(r.cards[0].easeFactor, 2.5);
});

test('parseImport : mix valide / invalide → garde les bonnes, signale les autres', () => {
  const r = parseImport([
    { theme: 'js', type: 'quiz', question: 'Q', choices: ['a', 'b'], answer: 0, difficulty: 1 },
    { theme: 'js', type: 'quiz', question: '', choices: ['a'], answer: 0, difficulty: 1 },
  ]);
  assert.equal(r.cards.length, 1);
  assert.equal(r.errors.length, 1);
});

test('emptyCard : quiz a 4 choices vides', () => {
  const c = emptyCard('quiz', 'react');
  assert.equal(c.type, 'quiz');
  assert.equal(c.theme, 'react');
  assert.equal(c.choices.length, 4);
});

test('emptyCard : challenge a 1 test starter', () => {
  const c = emptyCard('challenge');
  assert.equal(c.type, 'challenge');
  assert.equal(c.tests.length, 1);
  assert.ok(c.starterCode.includes('function'));
});
