import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check } from 'lucide-react';
import db from '../db/dexie.js';
import { progressPercent } from '../lib/courses.js';
import Skeleton from '../components/ui/Skeleton.jsx';

const THEME_LABEL = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  react: 'React',
  algo: 'Algo',
  ia: 'IA & Agents',
};

export default function Courses() {
  const navigate = useNavigate();
  const [themeFilter, setThemeFilter] = useState('all');

  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const progressList = useLiveQuery(() => db.courseProgress.toArray(), [], []);

  const progressBySlug = useMemo(() => {
    const map = new Map();
    progressList.forEach((p) => map.set(p.slug, p));
    return map;
  }, [progressList]);

  const themes = useMemo(() => {
    if (!courses) return ['all'];
    const set = new Set(courses.map((c) => c.theme));
    return ['all', ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    if (!courses) return [];
    return themeFilter === 'all'
      ? courses
      : courses.filter((c) => c.theme === themeFilter);
  }, [courses, themeFilter]);

  const loading = courses === undefined;

  return (
    <section className="flex flex-col gap-3 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Cours</h1>
        <p className="text-sm text-slate-400">
          Apprends les concepts à ton rythme, puis teste-toi avec une session.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {themes.map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setThemeFilter(th)}
            className={[
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors',
              themeFilter === th
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40'
                : 'bg-slate-900 text-slate-400 ring-slate-800 hover:text-slate-200',
            ].join(' ')}
          >
            {th === 'all' ? 'Tous' : THEME_LABEL[th] ?? th}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <p className="rounded-xl bg-slate-900/40 p-6 text-center text-sm text-slate-500 ring-1 ring-slate-800">
            Aucun cours pour ce thème.
          </p>
        ) : (
          filtered.map((c) => {
            const p = progressBySlug.get(c.slug);
            const pct = progressPercent(c, p);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => navigate(`/courses/${c.slug}`)}
                className="group flex flex-col gap-2 rounded-2xl bg-slate-900 p-4 text-left ring-1 ring-slate-800 shadow-card transition-colors hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold tracking-tight text-slate-100">{c.title}</h3>
                  <span className="shrink-0 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                    {THEME_LABEL[c.theme] ?? c.theme}
                  </span>
                </div>
                {c.summary && <p className="text-xs text-slate-400">{c.summary}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={[
                        'h-full rounded-full transition-all',
                        p?.completed ? 'bg-emerald-400' : 'bg-emerald-500/70',
                      ].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    {p?.completed ? (
                      <>
                        <Check size={12} aria-hidden /> Terminé
                      </>
                    ) : pct > 0 ? (
                      `${pct}%`
                    ) : (
                      'Non commencé'
                    )}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
