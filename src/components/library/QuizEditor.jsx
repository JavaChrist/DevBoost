// Form spécifique pour éditer une carte Quiz.

const labelCls = 'text-xs font-semibold uppercase tracking-widest text-slate-400';
const inputCls =
  'w-full rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60';

export default function QuizEditor({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });
  const updateChoice = (i, v) => {
    const choices = [...value.choices];
    choices[i] = v;
    update({ choices });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Question</span>
        <textarea
          rows={3}
          value={value.question ?? ''}
          onChange={(e) => update({ question: e.target.value })}
          className={inputCls}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelCls}>Choix (sélectionne la bonne réponse)</legend>
        {(value.choices ?? []).map((c, i) => (
          <label
            key={i}
            className="flex items-center gap-2 rounded-lg bg-slate-950 px-2 py-1 ring-1 ring-slate-800 focus-within:ring-emerald-400/60"
          >
            <input
              type="radio"
              name="answer"
              checked={value.answer === i}
              onChange={() => update({ answer: i })}
              className="h-4 w-4 accent-emerald-400"
            />
            <input
              type="text"
              value={c}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`Choix ${String.fromCharCode(65 + i)}`}
              className="w-full bg-transparent text-sm text-slate-100 focus:outline-none"
            />
            {(value.choices?.length ?? 0) > 2 && (
              <button
                type="button"
                onClick={() => {
                  const choices = value.choices.filter((_, j) => j !== i);
                  const answer = value.answer >= choices.length ? choices.length - 1 : value.answer;
                  update({ choices, answer });
                }}
                className="text-xs text-slate-500 hover:text-rose-400"
                aria-label="Supprimer ce choix"
              >
                ✕
              </button>
            )}
          </label>
        ))}
        {(value.choices?.length ?? 0) < 6 && (
          <button
            type="button"
            onClick={() => update({ choices: [...(value.choices ?? []), ''] })}
            className="self-start rounded-md px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/10"
          >
            + ajouter un choix
          </button>
        )}
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Explication</span>
        <textarea
          rows={3}
          value={value.explanation ?? ''}
          onChange={(e) => update({ explanation: e.target.value })}
          className={inputCls}
          placeholder="Pourquoi cette réponse ?"
        />
      </label>
    </div>
  );
}
