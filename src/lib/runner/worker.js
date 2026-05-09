// Web Worker exécuteur de code utilisateur — isolation totale du main thread.
// Vite bundle ce worker en ES module (cf. vite.config.js : worker.format = 'es').
//
// Protocole :
//   in  : { id, code, tests }
//   out : { id, passed, failed, total, results }
//   out : { id, error } en cas d'exception inattendue (rare, executeCode capture déjà tout)

import { executeCode } from './runner.core.js';

self.addEventListener('message', (event) => {
  const { id, code, tests } = event.data ?? {};
  try {
    const report = executeCode(code, tests);
    self.postMessage({ id, ...report });
  } catch (err) {
    self.postMessage({
      id,
      passed: 0,
      failed: (tests ?? []).length,
      total: (tests ?? []).length,
      results: [],
      error: `${err.name ?? 'Error'}: ${err.message}`,
    });
  }
});
