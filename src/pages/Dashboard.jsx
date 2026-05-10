import { useNavigate } from 'react-router-dom';
import { AlarmClock, Sparkles } from 'lucide-react';
import { useUserStore } from '../store/useUserStore.js';
import { useSettingsStore } from '../store/useSettingsStore.js';
import { useSessionStore } from '../store/useSessionStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import StreakBadge from '../components/ui/StreakBadge.jsx';
import Button from '../components/ui/Button.jsx';
import InstallPrompt from '../components/ui/InstallPrompt.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import UserMenu from '../components/auth/UserMenu.jsx';
import SignOutButton from '../components/auth/SignOutButton.jsx';
import useDueCount from '../hooks/useDueCount.js';

const XP_PER_LEVEL = 100;

export default function Dashboard() {
  const navigate = useNavigate();
  const xp = useUserStore((s) => s.xp);
  const streak = useUserStore((s) => s.streak);
  const themes = useSettingsStore((s) => s.themes);
  const startFromDb = useSessionStore((s) => s.startFromDb);
  const sessionLoading = useSessionStore((s) => s.loading);
  const firstName = useAuthStore((s) => s.user?.firstName);

  const { count: dueCount } = useDueCount(themes);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;

  const onStart = async () => {
    const n = await startFromDb();
    if (n > 0) navigate('/session');
  };

  return (
    <section className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo64.png"
            alt="DevBoost"
            width="44"
            height="44"
            className="h-11 w-11 shrink-0 rounded-xl shadow-card ring-1 ring-slate-800"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {firstName ? `Salut ${firstName}` : 'DevBoost'}
            </h1>
            <p className="text-sm text-slate-400">Une session, chaque jour.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge streak={streak} />
          <UserMenu />
        </div>
      </header>

      <InstallPrompt />

      <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/40 p-5 ring-1 ring-slate-800 shadow-card">
        <div className="flex items-baseline justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Niveau {level}</span>
          <span>
            {xpInLevel} / {XP_PER_LEVEL} XP
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
            style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">XP totale : {xp}</p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800 shadow-card">
        <h2 className="text-lg font-bold tracking-tight">Session du jour</h2>
        <p className="mt-1 text-sm text-slate-400">
          {streak === 0
            ? 'Première session = premier 🔥. Allons-y !'
            : '7 quiz + 3 challenges, environ 5 minutes.'}
        </p>

        {dueCount == null ? (
          <Skeleton className="mt-3 h-6 w-40 rounded-full" />
        ) : dueCount > 0 ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <AlarmClock size={14} aria-hidden />
            {dueCount} carte{dueCount > 1 ? 's' : ''} à réviser
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles size={14} aria-hidden />
            Tu es à jour ! Une session de plus pour rester chaud.
          </p>
        )}

        <Button size="lg" className="mt-5 w-full" onClick={onStart} disabled={sessionLoading}>
          {sessionLoading ? 'Préparation…' : 'Démarrer la session'}
        </Button>
      </div>

      <SignOutButton className="mt-2" />
    </section>
  );
}
