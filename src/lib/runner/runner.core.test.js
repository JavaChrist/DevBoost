import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeCode, deepEqual, extractFunctionName } from './runner.core.js';

test('extractFunctionName : function declaration', () => {
  assert.equal(extractFunctionName('function reverse(s) { return s; }'), 'reverse');
});

test('extractFunctionName : const arrow', () => {
  assert.equal(extractFunctionName('const flatten = (arr) => arr.flat()'), 'flatten');
});

test('extractFunctionName : aucune fonction → null', () => {
  assert.equal(extractFunctionName('let x = 42;'), null);
});

test('deepEqual : primitifs, NaN, tableaux, objets', () => {
  assert.ok(deepEqual(1, 1));
  assert.ok(deepEqual(NaN, NaN));
  assert.ok(!deepEqual(1, '1'));
  assert.ok(deepEqual([1, [2, 3]], [1, [2, 3]]));
  assert.ok(!deepEqual([1, 2], [1, 2, 3]));
  assert.ok(deepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }));
  assert.ok(!deepEqual({ a: 1 }, { a: 1, b: 2 }));
});

test('executeCode : code correct → tous les tests passent', () => {
  const code = `function reverse(str) { return [...str].reverse().join(''); }`;
  const tests = [
    { label: 'hello', input: ['hello'], expected: 'olleh' },
    { label: 'vide', input: [''], expected: '' },
    { label: 'a', input: ['a'], expected: 'a' },
  ];
  const r = executeCode(code, tests);
  assert.equal(r.passed, 3);
  assert.equal(r.failed, 0);
  assert.ok(r.results.every((x) => x.ok));
});

test('executeCode : code partiellement faux → mix de ok/fail (pas de crash)', () => {
  const code = `function add(a, b) { return a - b; }`; // bug volontaire
  const tests = [
    { label: '1+2=3', input: [1, 2], expected: 3 },
    { label: '0+0=0', input: [0, 0], expected: 0 },
    { label: '5+5=10', input: [5, 5], expected: 10 },
  ];
  const r = executeCode(code, tests);
  assert.equal(r.total, 3);
  assert.equal(r.passed, 1); // seulement 0-0=0 passe
  assert.equal(r.failed, 2);
  assert.equal(r.results[0].ok, false);
  assert.equal(r.results[0].actual, -1);
});

test('executeCode : exception runtime → marque le test fail avec error sans crasher les autres', () => {
  const code = `function buggy(x) { if (x === 2) throw new TypeError('boom'); return x * 2; }`;
  const tests = [
    { label: '1', input: [1], expected: 2 },
    { label: '2 (boom)', input: [2], expected: 4 },
    { label: '3', input: [3], expected: 6 },
  ];
  const r = executeCode(code, tests);
  assert.equal(r.passed, 2);
  assert.equal(r.failed, 1);
  assert.match(r.results[1].error, /TypeError: boom/);
});

test('executeCode : syntax error → tous les tests fail avec erreur de syntaxe', () => {
  const code = `function bad( { return 1; }`;
  const tests = [{ label: 't', input: [], expected: 1 }];
  const r = executeCode(code, tests);
  assert.equal(r.passed, 0);
  assert.match(r.results[0].error, /syntaxe|exécution/i);
});

test('executeCode : nom de fonction introuvable → tous les tests fail', () => {
  const code = `let x = 1;`;
  const tests = [{ label: 't', input: [], expected: 1 }];
  const r = executeCode(code, tests);
  assert.equal(r.passed, 0);
  assert.match(r.results[0].error, /Aucune fonction/);
});

test('executeCode : challenge "flatten" du seed → ok', () => {
  const code = `function flatten(arr) { return [].concat(...arr); }`;
  const tests = [
    { label: '[[1,2],[3]]', input: [[[1, 2], [3]]], expected: [1, 2, 3] },
    { label: '[]', input: [[]], expected: [] },
    { label: '3 sous-tabs', input: [[[1], [2, 3], [4, 5, 6]]], expected: [1, 2, 3, 4, 5, 6] },
  ];
  const r = executeCode(code, tests);
  assert.equal(r.passed, 3);
});
