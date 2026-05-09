// Form spécifique pour éditer une carte Challenge.
// CodeEditor (CodeMirror) est lazy-importé via la lib parent (la Library est déjà lazy).

import CodeEditor from '../cards/CodeEditor.jsx';

const labelCls = 'text-xs font-semibold uppercase tracking-widest text-slate-400';
const inputCls =
  'w-full rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60';

function tryParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export default function ChallengeEditor({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  const updateTest = (i, patch) => {
    const tests = value.tests.map((t, j) => (j === i ? { ...t, ...patch } : t));
    update({ tests });
  };

  const removeTest = (i) => {
    const tests = value.tests.filter((_, j) => j !== i);
    update({ tests });
  };

  const addTest = () => {
    update({ tests: [...(value.tests ?? []), { label: `test ${value.tests.length + 1}`, input: [], expected: '' }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Énoncé (prompt)</span>
        <textarea
          rows={3}
          value={value.prompt ?? ''}
          onChange={(e) => update({ prompt: e.target.value })}
          className={inputCls}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className={labelCls}>Code de départ (starterCode)</span>
        <CodeEditor
          initialValue={value.starterCode ?? ''}
          onChange={(v) => update({ starterCode: v })}
          minHeight={140}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelCls}>Tests</legend>
        {(value.tests ?? []).map((t, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg bg-slate-950 p-2 ring-1 ring-slate-800"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={t.label}
                onChange={(e) => updateTest(i, { label: e.target.value })}
                placeholder="label"
                className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none"
              />
              {(value.tests?.length ?? 0) > 1 && (
                <button
                  type="button"
                  onClick={() => removeTest(i)}
                  className="text-xs text-slate-500 hover:text-rose-400"
                  aria-label="Supprimer ce test"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  Input (JSON array)
                </span>
                <input
                  type="text"
                  defaultValue={JSON.stringify(t.input ?? [])}
                  onBlur={(e) => {
                    const parsed = tryParse(e.target.value);
                    if (Array.isArray(parsed)) updateTest(i, { input: parsed });
                  }}
                  className="rounded bg-slate-900 px-2 py-1 font-mono text-[12px] text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-emerald-400/60"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  Expected (JSON)
                </span>
                <input
                  type="text"
                  defaultValue={JSON.stringify(t.expected ?? '')}
                  onBlur={(e) => {
                    const parsed = tryParse(e.target.value);
                    if (parsed !== undefined) updateTest(i, { expected: parsed });
                  }}
                  className="rounded bg-slate-900 px-2 py-1 font-mono text-[12px] text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-emerald-400/60"
                />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTest}
          className="self-start rounded-md px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/10"
        >
          + ajouter un test
        </button>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Astuce (hint)</span>
        <textarea
          rows={2}
          value={value.hint ?? ''}
          onChange={(e) => update({ hint: e.target.value })}
          className={inputCls}
        />
      </label>
    </div>
  );
}
