import { useState } from 'react';
// Liste des tests d'un challenge : repliée par défaut, dépliable au clic.

function fmt(value) {
  try {
    const s = JSON.stringify(value);
    if (s == null) return String(value);
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  } catch {
    return String(value);
  }
}

function tone(r, running) {
  if (!r) return running
    ? 'bg-slate-800/60 ring-slate-700 text-slate-300'
    : 'bg-slate-800/30 ring-slate-800 text-slate-400 hover:bg-slate-800/60';
  return r.ok
    ? 'bg-emerald-500/10 ring-emerald-400/30 text-emerald-200 hover:bg-emerald-500/15'
    : 'bg-rose-500/10 ring-rose-400/30 text-rose-200 hover:bg-rose-500/15';
}

function StatusBadge({ r, running, index }) {
  if (!r) {
    return (
      <span className="shrink-0 rounded-md bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
        {running ? '…' : `T${index + 1}`}
      </span>
    );
  }
  return (
    <span
      className={[
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold',
        r.ok ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200',
      ].join(' ')}
      aria-label={r.ok ? 'Test réussi' : 'Test échoué'}
    >
      {r.ok ? '✓' : '✗'}
    </span>
  );
}

function TestRow({ test, result, running, index }) {
  // Auto-déplié si le test échoue, replié sinon.
  const [open, setOpen] = useState(false);
  const isFail = result && !result.ok;
  const expanded = open || isFail;

  const inputDisplay =
    Array.isArray(test.input)
      ? test.input.map(fmt).join(', ')
      : test.input !== undefined
        ? fmt(test.input)
        : '—';

  return (
    <li className={['rounded-lg ring-1 transition-colors', tone(result, running)].join(' ')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded-lg"
      >
        <StatusBadge r={result} running={running} index={index} />
        <span className="min-w-0 flex-1 truncate font-medium">{test.label}</span>
        <span
          aria-hidden
          className={[
            'shrink-0 text-slate-500 transition-transform',
            expanded ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
        >
          ▾
        </span>
      </button>
      {expanded && (
        <div className="space-y-1 border-t border-current/10 px-2.5 py-1.5 text-[11px] text-slate-400">
          <p>
            <span className="text-slate-500">Entrée : </span>
            <code className="rounded bg-slate-950/60 px-1 py-0.5 text-slate-300">
              {inputDisplay}
            </code>
          </p>
          <p>
            <span className="text-slate-500">Attendu : </span>
            <code className="rounded bg-slate-950/60 px-1 py-0.5 text-slate-300">
              {fmt(test.expected)}
            </code>
          </p>
          {result && !result.ok && (
            <p className="text-rose-300">
              <span className="text-slate-500">Reçu : </span>
              <code className="rounded bg-slate-950/60 px-1 py-0.5">
                {result.error ? result.error : fmt(result.actual)}
              </code>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function TestList({ tests = [], results = null, running = false }) {
  if (tests.length === 0) return null;
  const passCount = results ? results.filter((r) => r.ok).length : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Tests {results ? `(${passCount}/${tests.length})` : `(${tests.length})`}
        </p>
        {!results && !running && (
          <p className="text-[10px] italic text-slate-600">Touche pour voir le détail</p>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {tests.map((t, i) => (
          <TestRow key={i} test={t} result={results?.[i]} running={running} index={i} />
        ))}
      </ul>
    </div>
  );
}
