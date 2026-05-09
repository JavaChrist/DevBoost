import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHHmm, nextOccurrenceAt } from './notifications.js';

test('parseHHmm : formats valides', () => {
  assert.deepEqual(parseHHmm('08:30'), { h: 8, m: 30 });
  assert.deepEqual(parseHHmm('00:00'), { h: 0, m: 0 });
  assert.deepEqual(parseHHmm('23:59'), { h: 23, m: 59 });
  assert.deepEqual(parseHHmm('9:05'), { h: 9, m: 5 });
});

test('parseHHmm : formats invalides → null', () => {
  assert.equal(parseHHmm(''), null);
  assert.equal(parseHHmm('25:00'), null);
  assert.equal(parseHHmm('12:60'), null);
  assert.equal(parseHHmm('abc'), null);
  assert.equal(parseHHmm(null), null);
});

test('nextOccurrenceAt : heure du futur aujourd’hui → aujourd’hui', () => {
  const now = new Date('2026-03-15T08:00:00');
  const next = new Date(nextOccurrenceAt('20:30', now));
  assert.equal(next.toISOString().slice(0, 10), '2026-03-15');
  assert.equal(next.getHours(), 20);
  assert.equal(next.getMinutes(), 30);
});

test('nextOccurrenceAt : heure du passé → demain', () => {
  const now = new Date('2026-03-15T20:00:00');
  const next = new Date(nextOccurrenceAt('08:30', now));
  assert.equal(next.toISOString().slice(0, 10), '2026-03-16');
  assert.equal(next.getHours(), 8);
  assert.equal(next.getMinutes(), 30);
});

test('nextOccurrenceAt : heure pile maintenant → demain', () => {
  const now = new Date('2026-03-15T08:30:00');
  const next = new Date(nextOccurrenceAt('08:30', now));
  assert.equal(next.toISOString().slice(0, 10), '2026-03-16');
});

test('nextOccurrenceAt : input invalide → null', () => {
  assert.equal(nextOccurrenceAt('25:00'), null);
  assert.equal(nextOccurrenceAt(null), null);
});
