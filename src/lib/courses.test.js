import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCourse, progressPercent } from './courses.js';

test('validateCourse : accepte un cours bien formé', () => {
  const c = {
    slug: 'css-basics',
    theme: 'css',
    title: 'CSS basics',
    summary: 's',
    level: 1,
    sections: [{ heading: 'Intro', body: 'Hello' }],
    quiz: [{ question: 'Q?', choices: ['a', 'b'], answer: 1, explanation: 'e' }],
  };
  assert.equal(validateCourse(c).ok, true);
});

test('validateCourse : refuse un slug manquant', () => {
  const c = { theme: 'css', title: 't', sections: [{ heading: 'h', body: 'b' }] };
  const r = validateCourse(c);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('slug')));
});

test('validateCourse : refuse une answer hors bornes', () => {
  const c = {
    slug: 's',
    theme: 'css',
    title: 't',
    sections: [{ heading: 'h', body: 'b' }],
    quiz: [{ question: 'Q?', choices: ['a', 'b'], answer: 5 }],
  };
  const r = validateCourse(c);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('answer')));
});

test('validateCourse : refuse section sans body', () => {
  const c = { slug: 's', theme: 'css', title: 't', sections: [{ heading: 'h' }] };
  const r = validateCourse(c);
  assert.equal(r.ok, false);
});

test('progressPercent : 0% si pas de progress', () => {
  const c = { sections: [{}, {}, {}, {}] };
  assert.equal(progressPercent(c, null), 0);
});

test('progressPercent : 100% si completed', () => {
  const c = { sections: [{}, {}, {}, {}] };
  assert.equal(progressPercent(c, { completed: true }), 100);
});

test('progressPercent : proportionnel aux sections vues', () => {
  const c = { sections: [{}, {}, {}, {}] }; // 4 sections
  // section 0 vue → 1/4 = 25% × 80 = 20
  assert.equal(progressPercent(c, { lastSection: 0 }), 20);
  // section 3 vue (dernière) → 4/4 = 100% × 80 = 80, plafonné à 99
  assert.equal(progressPercent(c, { lastSection: 3 }), 80);
});

test('progressPercent : capé à 99 sans completed', () => {
  const c = { sections: [{}, {}] };
  // 2/2 sections × 80 = 80 — pas 100 tant que !completed
  assert.equal(progressPercent(c, { lastSection: 1 }), 80);
});
