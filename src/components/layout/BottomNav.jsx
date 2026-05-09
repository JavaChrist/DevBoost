import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/courses', label: 'Cours', icon: '📖' },
  { to: '/library', label: 'Cartes', icon: '📚' },
  { to: '/stats', label: 'Stats', icon: '📈' },
  { to: '/settings', label: 'Réglages', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-800 bg-slate-950/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.to === '/'}
              aria-label={t.label}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors rounded-md',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200',
                ].join(' ')
              }
            >
              <span aria-hidden className="text-lg leading-none">
                {t.icon}
              </span>
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
