// Cœur d'exécution des challenges — pur, sans Worker, testable directement en Node.
// Le Worker (worker.js) ne fait que router les messages et appeler executeCode().
//
// IMPORTANT : ce module DOIT pouvoir tourner dans un Worker isolé. Pas d'import de
// modules React/Dexie/etc. ici.

const FN_NAME_RE = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/;
const FN_NAME_RE_ARROW = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|function|[A-Za-z_$])/;

export function extractFunctionName(code = '') {
  const m1 = code.match(FN_NAME_RE);
  if (m1) return m1[1];
  const m2 = code.match(FN_NAME_RE_ARROW);
  if (m2) return m2[1];
  return null;
}

// Comparaison structurelle (suffisant pour types JSON-able + NaN).
export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (Array.isArray(b)) return false;

  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

// Exécute le code utilisateur sur la liste de tests, renvoie un rapport
// { passed, failed, total, results: [{label, ok, error?, actual?, expected}] }.
//
// Convention : le code utilisateur doit déclarer une fonction (function NAME(...) ou
// const NAME = ...). On la récupère via `new Function('… ; return NAME;')()`.
export function executeCode(code, tests = []) {
  const fnName = extractFunctionName(code);
  if (!fnName) {
    return {
      passed: 0,
      failed: tests.length,
      total: tests.length,
      results: tests.map((t) => ({
        label: t.label,
        ok: false,
        error: 'Aucune fonction nommée trouvée dans ton code.',
        expected: t.expected,
      })),
    };
  }

  let fn;
  try {
    fn = new Function(`"use strict";\n${code}\n;return ${fnName};`)();
  } catch (err) {
    return {
      passed: 0,
      failed: tests.length,
      total: tests.length,
      results: tests.map((t) => ({
        label: t.label,
        ok: false,
        error: `Erreur de syntaxe / exécution : ${err.message}`,
        expected: t.expected,
      })),
    };
  }

  if (typeof fn !== 'function') {
    return {
      passed: 0,
      failed: tests.length,
      total: tests.length,
      results: tests.map((t) => ({
        label: t.label,
        ok: false,
        error: `\`${fnName}\` n'est pas une fonction.`,
        expected: t.expected,
      })),
    };
  }

  const results = [];
  let passed = 0;
  for (const t of tests) {
    const args = Array.isArray(t.input) ? t.input : [t.input];
    try {
      const actual = fn(...args);
      const ok = deepEqual(actual, t.expected);
      if (ok) passed += 1;
      results.push({ label: t.label, ok, actual, expected: t.expected });
    } catch (err) {
      results.push({
        label: t.label,
        ok: false,
        error: `${err.name ?? 'Error'}: ${err.message}`,
        expected: t.expected,
      });
    }
  }

  return {
    passed,
    failed: tests.length - passed,
    total: tests.length,
    results,
  };
}

export default executeCode;
