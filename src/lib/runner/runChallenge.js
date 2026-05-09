// API publique du runner.
//
// Usage :
//   import { runChallenge } from '@/lib/runner/runChallenge';
//   const result = await runChallenge(userCode, card.tests);
//   // → { passed, failed, total, results: [...], timedOut?: true, error? }
//
// Le main thread ne fait JAMAIS d'eval/Function : tout le code utilisateur est exécuté
// dans un Worker isolé, terminé après 3 s en cas de boucle infinie.

const DEFAULT_TIMEOUT_MS = 3000;

// `workerFactory` est injectable pour les tests (mock). En prod : useDefault.
function defaultWorkerFactory() {
  return new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
    name: 'devboost-runner',
  });
}

let nextId = 0;

export function runChallenge(code, tests = [], options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    workerFactory = defaultWorkerFactory,
  } = options;

  const id = ++nextId;
  const total = tests.length;

  return new Promise((resolve) => {
    let worker;
    try {
      worker = workerFactory();
    } catch (err) {
      resolve(timeoutFallback({ total, tests, error: `Worker indisponible : ${err.message}` }));
      return;
    }

    let settled = false;
    const cleanup = () => {
      try {
        worker.terminate?.();
      } catch {
        /* noop */
      }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        passed: 0,
        failed: total,
        total,
        timedOut: true,
        error: `Timeout : ton code a dépassé ${timeoutMs} ms (boucle infinie ?).`,
        results: tests.map((t) => ({
          label: t.label,
          ok: false,
          error: 'Timeout',
          expected: t.expected,
        })),
      });
    }, timeoutMs);

    const onMessage = (event) => {
      if (settled) return;
      const data = event.data ?? {};
      if (data.id !== id) return; // garde sur stale messages
      settled = true;
      clearTimeout(timer);
      cleanup();
      const { id: _omit, ...rest } = data;
      void _omit;
      resolve({ total, ...rest });
    };

    const onError = (event) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve(
        timeoutFallback({
          total,
          tests,
          error: `Worker error : ${event.message ?? 'unknown'}`,
        }),
      );
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.addEventListener('messageerror', onError);

    try {
      worker.postMessage({ id, code, tests });
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(timeoutFallback({ total, tests, error: `postMessage failed : ${err.message}` }));
      }
    }
  });
}

function timeoutFallback({ total, tests, error }) {
  return {
    passed: 0,
    failed: total,
    total,
    error,
    results: tests.map((t) => ({
      label: t.label,
      ok: false,
      error,
      expected: t.expected,
    })),
  };
}

export default runChallenge;
