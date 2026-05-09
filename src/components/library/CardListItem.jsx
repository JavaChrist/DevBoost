const TYPE_BADGE = {
  quiz: { label: 'Quiz', cls: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' },
  challenge: { label: 'Code', cls: 'bg-amber-500/10 text-amber-300 ring-amber-400/20' },
};

function difficultyDots(d = 1) {
  return '●'.repeat(Math.max(1, Math.min(3, d))) + '○'.repeat(3 - Math.max(1, Math.min(3, d)));
}

export default function CardListItem({ card, onClick }) {
  const t = TYPE_BADGE[card.type] ?? TYPE_BADGE.quiz;
  const title = card.type === 'quiz' ? card.question : card.prompt;
  return (
    <button
      type="button"
      onClick={() => onClick?.(card)}
      className="flex w-full items-start gap-3 rounded-xl bg-slate-900 p-3 text-left ring-1 ring-slate-800 transition-colors hover:bg-slate-800/70 active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
    >
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span
          className={[
            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1',
            t.cls,
          ].join(' ')}
        >
          {t.label}
        </span>
        <span className="text-[10px] tabular-nums tracking-widest text-slate-500">
          {difficultyDots(card.difficulty)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {card.theme}
        </p>
        <p className="line-clamp-2 text-sm leading-snug text-slate-100">{title || '— sans titre —'}</p>
      </div>
      <span aria-hidden className="self-center text-slate-500">
        ›
      </span>
    </button>
  );
}
