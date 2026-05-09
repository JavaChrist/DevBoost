export default function ProgressBar({ value = 0, max = 100, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={['h-2 w-full overflow-hidden rounded-full bg-slate-800', className].join(' ')}
    >
      <div
        className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
