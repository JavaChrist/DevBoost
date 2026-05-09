import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runChallenge } from './runChallenge.js';
import { executeCode } from './runner.core.js';

// Mock minimal d'un Worker compatible avec runChallenge.
class MockWorker {
  constructor({ behavior = 'execute', delayMs = 0 } = {}) {
    this.behavior = behavior;
    this.delayMs = delayMs;
    this._listeners = { message: [], error: [], messageerror: [] };
    this._terminated = false;
  }
  addEventListener(type, fn) {
    this._listeners[type]?.push(fn);
  }
  removeEventListener(type, fn) {
    const arr = this._listeners[type];
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }
  terminate() {
    this._terminated = true;
  }
  _emit(type, event) {
    if (this._terminated) return;
    for (const fn of this._listeners[type] ?? []) fn(event);
  }
  postMessage(msg) {
    if (this.behavior === 'silent') return; // simule boucle infinie : jamais de réponse
    if (this.behavior === 'error') {
      setTimeout(() => this._emit('error', { message: 'boom' }), this.delayMs);
      return;
    }
    setTimeout(() => {
      const report = executeCode(msg.code, msg.tests);
      this._emit('message', { data: { id: msg.id, ...report } });
    }, this.delayMs);
  }
}

test('runChallenge : code correct → passed === total (via mock worker)', async () => {
  const code = `function reverse(s) { return [...s].reverse().join(''); }`;
  const tests = [
    { label: 'a', input: ['a'], expected: 'a' },
    { label: 'ab', input: ['ab'], expected: 'ba' },
    { label: 'abc', input: ['abc'], expected: 'cba' },
  ];
  const r = await runChallenge(code, tests, {
    workerFactory: () => new MockWorker(),
  });
  assert.equal(r.passed, 3);
  assert.equal(r.failed, 0);
  assert.equal(r.total, 3);
  assert.ok(!r.timedOut);
});

test('runChallenge : un test échoue → passed < total, mais pas de crash', async () => {
  const code = `function add(a,b){ return a-b; }`;
  const tests = [
    { label: '1+2', input: [1, 2], expected: 3 },
    { label: '0+0', input: [0, 0], expected: 0 },
  ];
  const r = await runChallenge(code, tests, {
    workerFactory: () => new MockWorker(),
  });
  assert.equal(r.passed, 1);
  assert.equal(r.failed, 1);
});

test('runChallenge : boucle infinie → timeout déclenché et worker terminé', async () => {
  const mockWorker = new MockWorker({ behavior: 'silent' });
  const code = `function loop(){ while(true){} }`;
  const tests = [{ label: 'never returns', input: [], expected: 1 }];

  const t0 = Date.now();
  const r = await runChallenge(code, tests, {
    timeoutMs: 80,
    workerFactory: () => mockWorker,
  });
  const elapsed = Date.now() - t0;

  assert.equal(r.timedOut, true, 'timeout flag attendu');
  assert.equal(r.passed, 0);
  assert.equal(r.failed, 1);
  assert.match(r.error, /Timeout/);
  assert.equal(mockWorker._terminated, true, 'le worker doit être terminé');
  assert.ok(elapsed >= 80 && elapsed < 500, `elapsed ~= 80ms (got ${elapsed})`);
});

test('runChallenge : worker.error → résultat dégradé sans crash', async () => {
  const code = `function ok(){ return 1; }`;
  const tests = [{ label: 't', input: [], expected: 1 }];
  const r = await runChallenge(code, tests, {
    workerFactory: () => new MockWorker({ behavior: 'error' }),
    timeoutMs: 200,
  });
  assert.equal(r.passed, 0);
  assert.match(r.error, /Worker error/);
});

test('runChallenge : workerFactory jette → fallback sans rejet', async () => {
  const r = await runChallenge('function f(){}', [{ label: 't', input: [], expected: 1 }], {
    workerFactory: () => {
      throw new Error('no worker support');
    },
  });
  assert.equal(r.passed, 0);
  assert.match(r.error, /Worker indisponible/);
});
