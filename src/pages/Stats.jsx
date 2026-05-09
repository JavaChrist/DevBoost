import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import db from '../db/dexie.js';
import { useUserStore } from '../store/useUserStore.js';
import { computeStreaks, dailySessions, themeStats, aggregate } from '../lib/stats.js';
import StreakBadge from '../components/ui/StreakBadge.jsx';

const THEME_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#fb7185'];

export default function Stats() {
  const xp = useUserStore((s) => s.xp);
  const streakUser = useUserStore((s) => s.streak);

  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const reviews = useLiveQuery(() => db.reviews.toArray(), [], []);
  const cards = useLiveQuery(() => db.cards.toArray(), [], []);

  const streaks = useMemo(() => computeStreaks(sessions), [sessions]);
  const last30 = useMemo(() => dailySessions(sessions, 30), [sessions]);
  const themes = useMemo(() => themeStats(reviews, cards), [reviews, cards]);
  const agg = useMemo(() => aggregate(sessions, reviews), [sessions, reviews]);
  const empty = sessions.length === 0;

  return (
    <section className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Statistiques</h1>
          <p className="text-sm text-slate-400">Tes progrès en un coup d’œil.</p>
        </div>
        <StreakBadge streak={streakUser} />
      </header>

      {empty && (
        <div className="rounded-2xl bg-slate-900/40 p-6 text-center text-sm text-slate-500 ring-1 ring-slate-800">
          Pas encore de stats : termine ta première session pour voir tes progrès apparaître ici.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <KpiCard label="Streak" value={streaks.current} suffix="🔥" tone="amber" />
        <KpiCard label="Max" value={streaks.max} suffix="j" tone="slate" />
        <KpiCard label="XP" value={xp} tone="emerald" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <KpiCard label="Sessions" value={agg.totalSessions} tone="slate" />
        <KpiCard label="Cartes vues" value={agg.totalCards} tone="slate" />
        <KpiCard
          label="Réussite"
          value={`${Math.round(agg.successRate * 100)}%`}
          tone="emerald"
        />
      </div>

      {/* Sparkline des 30 derniers jours */}
      <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold tracking-tight">Activité — 30 jours</h2>
          <span className="text-[11px] text-slate-500">cartes / jour</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last30} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="key" tick={false} axisLine={false} />
              <Tooltip content={<DayTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="cards"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#grad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut % réussite par thème */}
      {themes.length > 0 && (
        <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
          <h2 className="mb-3 text-sm font-bold tracking-tight">Réussite par thème</h2>
          <div className="flex items-center gap-3">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themes}
                    dataKey="total"
                    nameKey="theme"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {themes.map((_, i) => (
                      <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {themes.map((t, i) => (
                <li key={t.theme} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-slate-200">{t.theme}</span>
                  <span className="tabular-nums text-slate-400">
                    {Math.round(t.ratio * 100)}% · {t.passed}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function KpiCard({ label, value, suffix, tone = 'slate' }) {
  const toneCls = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    slate: 'text-slate-100',
  }[tone];
  return (
    <div className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={['mt-1 text-2xl font-extrabold leading-none tracking-tight', toneCls].join(' ')}>
        {value}
        {suffix && <span className="ml-1 text-base">{suffix}</span>}
      </p>
    </div>
  );
}

function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md bg-slate-950 px-2 py-1 text-[11px] text-slate-100 ring-1 ring-slate-800">
      <p className="font-semibold">{d.key}</p>
      <p className="text-slate-400">
        {d.cards} carte{d.cards > 1 ? 's' : ''} · {d.passed} OK
      </p>
    </div>
  );
}
