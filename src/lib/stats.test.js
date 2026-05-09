import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreaks, dailySessions, themeStats, aggregate } from './stats.js';

const DAY = 86_400_000;
const TODAY = new Date('2026-03-15T20:00:00');

function s(daysAgo, opts = {}) {
  return { date: new Date(TODAY.getTime() - daysAgo * DAY), cardsCount: 10, passed: 7, ...opts };
}

test('computeStreaks : aucune session → 0/0', () => {
  assert.deepEqual(computeStreaks([], TODAY), { current: 0, max: 0 });
});

test('computeStreaks : streak en cours qui inclut aujourd’hui', () => {
  const sessions = [s(0), s(1), s(2)];
  assert.deepEqual(computeStreaks(sessions, TODAY), { current: 3, max: 3 });
});

test('computeStreaks : current = 0 si dernière session > hier', () => {
  const sessions = [s(2), s(3), s(4)];
  assert.deepEqual(computeStreaks(sessions, TODAY), { current: 0, max: 3 });
});

test('computeStreaks : 2 sessions le même jour ne comptent qu’une fois', () => {
  const sessions = [s(0), s(0), s(1)];
  assert.deepEqual(computeStreaks(sessions, TODAY), { current: 2, max: 2 });
});

test('computeStreaks : max != current quand il y a un trou', () => {
  const sessions = [s(0), s(1), s(5), s(6), s(7), s(8)];
  const r = computeStreaks(sessions, TODAY);
  assert.equal(r.current, 2);
  assert.equal(r.max, 4);
});

test('dailySessions : N=7 jours, dernier = aujourd’hui', () => {
  const out = dailySessions([s(0), s(2), s(2)], 7, TODAY);
  assert.equal(out.length, 7);
  assert.equal(out[6].sessions, 1);
  assert.equal(out[6].cards, 10);
  assert.equal(out[4].sessions, 2);
  assert.equal(out[4].cards, 20);
});

test('dailySessions : ignore les sessions hors fenêtre', () => {
  const out = dailySessions([s(0), s(60)], 30, TODAY);
  const tot = out.reduce((acc, b) => acc + b.sessions, 0);
  assert.equal(tot, 1);
});

test('themeStats : agrège par thème + ratio', () => {
  const cards = [
    { id: 1, theme: 'js' },
    { id: 2, theme: 'js' },
    { id: 3, theme: 'react' },
  ];
  const reviews = [
    { cardId: 1, quality: 5 },
    { cardId: 1, quality: 2 },
    { cardId: 2, quality: 4 },
    { cardId: 3, quality: 1 },
  ];
  const r = themeStats(reviews, cards);
  const js = r.find((x) => x.theme === 'js');
  const react = r.find((x) => x.theme === 'react');
  assert.equal(js.total, 3);
  assert.equal(js.passed, 2);
  assert.ok(Math.abs(js.ratio - 2 / 3) < 1e-6);
  assert.equal(react.total, 1);
  assert.equal(react.passed, 0);
  assert.equal(react.ratio, 0);
});

test('themeStats : trié par total desc', () => {
  const cards = [
    { id: 1, theme: 'js' },
    { id: 2, theme: 'react' },
  ];
  const reviews = [
    { cardId: 2, quality: 5 },
    { cardId: 2, quality: 5 },
    { cardId: 1, quality: 5 },
  ];
  const r = themeStats(reviews, cards);
  assert.equal(r[0].theme, 'react');
  assert.equal(r[1].theme, 'js');
});

test('aggregate : compte sessions, cartes, % réussite', () => {
  const sessions = [s(0), s(1, { passed: 10 })];
  const reviews = [
    { cardId: 1, quality: 5 },
    { cardId: 1, quality: 2 },
    { cardId: 2, quality: 4 },
  ];
  const r = aggregate(sessions, reviews);
  assert.equal(r.totalSessions, 2);
  assert.equal(r.totalCards, 20);
  assert.equal(r.totalPassed, 17);
  assert.equal(r.totalReviews, 3);
  assert.ok(Math.abs(r.successRate - 2 / 3) < 1e-6);
});
