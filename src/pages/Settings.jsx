import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie.js';
import { resetDatabase } from '../db/seed.js';
import { useSettingsStore } from '../store/useSettingsStore.js';
import { useUserStore } from '../store/useUserStore.js';
import { KNOWN_THEMES } from '../lib/cards.js';
import {
  isNotificationSupported,
  getPermission,
  requestPermission,
  showNotification,
} from '../lib/notifications.js';
import { sound, vibrate } from '../lib/feedback.js';
import { toast } from '../store/useToastStore.js';
import Button from '../components/ui/Button.jsx';

export default function Settings() {
  const sessionDuration = useSettingsStore((s) => s.sessionDuration);
  const themes = useSettingsStore((s) => s.themes);
  const notifyAt = useSettingsStore((s) => s.notifyAt);
  const soundOn = useSettingsStore((s) => s.sound);
  const hapticOn = useSettingsStore((s) => s.haptic);
  const setSessionDuration = useSettingsStore((s) => s.setSessionDuration);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setNotifyAt = useSettingsStore((s) => s.setNotifyAt);
  const setSound = useSettingsStore((s) => s.setSound);
  const setHaptic = useSettingsStore((s) => s.setHaptic);

  const [permission, setPermission] = useState(getPermission());
  const [confirmReset, setConfirmReset] = useState(false);

  // Recalcule la permission quand la fenêtre revient au focus.
  useEffect(() => {
    const onFocus = () => setPermission(getPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const cards = useLiveQuery(() => db.cards.count(), [], 0);
  const sessions = useLiveQuery(() => db.sessions.count(), [], 0);
  const reviews = useLiveQuery(() => db.reviews.count(), [], 0);

  const allThemes = Array.from(new Set([...KNOWN_THEMES, ...themes])).sort();
  const totalCards = sessionDuration * 2;
  const challengeCount = Math.max(1, Math.round(totalCards * 0.3));
  const quizCount = Math.max(1, totalCards - challengeCount);

  const handleEnableNotifs = async () => {
    if (!isNotificationSupported()) return;
    if (permission === 'denied') {
      alert(
        'Les notifications sont bloquées dans ton navigateur. Autorise-les dans les réglages du site puis reviens ici.',
      );
      return;
    }
    const result = await requestPermission();
    setPermission(result);
    if (result === 'granted' && !notifyAt) setNotifyAt('19:00');
  };

  const handleTestNotif = () => {
    const ok = showNotification('DevBoost — test', {
      body: 'Cette notif fonctionne 🎉',
      tag: 'devboost-test',
    });
    if (!ok) toast.error('Impossible d’envoyer la notif');
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSound(next);
    if (next) sound.ok(); // démo immédiate
  };
  const handleToggleHaptic = () => {
    const next = !hapticOn;
    setHaptic(next);
    if (next) vibrate(30);
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetDatabase();
    useUserStore.getState().hydrate(null);
    useSettingsStore.getState().hydrate(null);
    toast.show('Base réinitialisée');
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <section className="flex flex-col gap-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Réglages</h1>
        <p className="text-sm text-slate-400">Ajuste DevBoost à ton rythme.</p>
      </header>

      {/* Thèmes */}
      <Section title="Thèmes actifs" subtitle={`${themes.length} sur ${allThemes.length}`}>
        <div className="flex flex-wrap gap-2">
          {allThemes.map((th) => {
            const active = themes.includes(th);
            return (
              <button
                key={th}
                type="button"
                onClick={() => toggleTheme(th)}
                aria-pressed={active}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition-colors',
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40'
                    : 'bg-slate-900 text-slate-400 ring-slate-800 hover:text-slate-200',
                ].join(' ')}
              >
                {th}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Durée */}
      <Section
        title="Durée cible de session"
        subtitle={`${sessionDuration} min · ${quizCount} quiz + ${challengeCount} challenges`}
      >
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={sessionDuration}
          onChange={(e) => setSessionDuration(Number(e.target.value))}
          className="w-full accent-emerald-400"
          aria-label="Durée cible de session en minutes"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-500">
          <span>2 min</span>
          <span>5 min</span>
          <span>10 min</span>
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Effets">
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Son"
            description="Petit bip à chaque réponse."
            checked={soundOn}
            onChange={handleToggleSound}
          />
          <ToggleRow
            label="Vibration"
            description="Petit retour haptique sur mobile."
            checked={hapticOn}
            onChange={handleToggleHaptic}
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notification quotidienne">
        {!isNotificationSupported() ? (
          <p className="text-xs text-slate-500">
            Ton navigateur ne supporte pas les notifications.
          </p>
        ) : permission !== 'granted' ? (
          <Button size="md" onClick={handleEnableNotifs}>
            {permission === 'denied' ? 'Notifications bloquées' : 'Activer les notifications'}
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">Heure du rappel</span>
              <input
                type="time"
                value={notifyAt ?? ''}
                onChange={(e) => setNotifyAt(e.target.value || null)}
                className="rounded-lg bg-slate-950 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {notifyAt
                  ? `Tu seras rappelé à ${notifyAt}.`
                  : 'Choisis une heure pour activer le rappel.'}
              </span>
              <button
                type="button"
                onClick={handleTestNotif}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-slate-800 hover:bg-slate-800"
              >
                Tester
              </button>
            </div>
            {notifyAt && (
              <button
                type="button"
                onClick={() => setNotifyAt(null)}
                className="self-start text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
              >
                Désactiver le rappel
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Données */}
      <Section title="Données locales">
        <ul className="text-xs text-slate-400">
          <li>· {cards} cartes en base</li>
          <li>· {sessions} sessions enregistrées</li>
          <li>· {reviews} reviews</li>
        </ul>
        <Button
          variant={confirmReset ? 'danger' : 'ghost'}
          size="md"
          onClick={handleReset}
          className="mt-3 w-full ring-1 ring-slate-800"
        >
          {confirmReset ? 'Confirmer la réinitialisation ?' : 'Réinitialiser DevBoost'}
        </Button>
        {confirmReset && (
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="mt-1 w-full text-center text-[11px] text-slate-500 hover:text-slate-300"
          >
            Annuler
          </button>
        )}
        <p className="mt-2 text-[11px] text-slate-500">
          Supprime toutes les cartes, sessions et progrès. Le seed initial sera rejoué.
        </p>
      </Section>

      <p className="pb-4 pt-2 text-center text-[11px] text-slate-600">DevBoost v0.1 · MVP</p>
    </section>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-bold tracking-tight text-slate-100">{title}</h2>
        {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-1.5 hover:bg-slate-800/40">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
          checked ? 'bg-emerald-500' : 'bg-slate-700',
        ].join(' ')}
      >
        <span
          aria-hidden
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
