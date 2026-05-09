import ProgressBar from './ProgressBar.jsx';

export default function XPBar({ xp = 0, level, nextLevelXp = 100, className = '' }) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      <div className="flex items-baseline justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          {level != null ? `Niveau ${level}` : 'XP'}
        </span>
        <span>
          {xp} / {nextLevelXp} XP
        </span>
      </div>
      <ProgressBar value={xp} max={nextLevelXp} />
    </div>
  );
}
