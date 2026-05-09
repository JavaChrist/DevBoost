import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStreak, isSameDay, diffInDays } from './streak.js';

test('jamais joué → streak = 1', () => {
  assert.equal(nextStreak({ currentStreak: 0, lastSessionDate: null }), 1);
});

test('joué aujourd’hui → inchangé (anti double-comptage)', () => {
  const today = new Date('2026-03-15T20:00:00');
  const lastSessionDate = new Date('2026-03-15T08:00:00');
  assert.equal(nextStreak({ currentStreak: 7, lastSessionDate, today }), 7);
});

test('joué hier → +1', () => {
  const today = new Date('2026-03-15T08:00:00');
  const lastSessionDate = new Date('2026-03-14T22:00:00');
  assert.equal(nextStreak({ currentStreak: 7, lastSessionDate, today }), 8);
});

test('joué avant-hier (gap ≥ 2 jours) → reset à 1', () => {
  const today = new Date('2026-03-15T08:00:00');
  const lastSessionDate = new Date('2026-03-13T22:00:00');
  assert.equal(nextStreak({ currentStreak: 7, lastSessionDate, today }), 1);
});

test('lastSessionDate invalide → 1', () => {
  assert.equal(nextStreak({ currentStreak: 5, lastSessionDate: 'not a date' }), 1);
});

test('isSameDay et diffInDays — jour local', () => {
  const a = new Date('2026-03-15T01:00:00');
  const b = new Date('2026-03-15T23:00:00');
  const c = new Date('2026-03-16T00:30:00');
  assert.ok(isSameDay(a, b));
  assert.equal(diffInDays(a, c), 1);
});
