import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Library, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Accueil', Icon: Home },
  { to: '/courses', label: 'Cours', Icon: BookOpen },
  { to: '/library', label: 'Cartes', Icon: Library },
  { to: '/stats', label: 'Stats', Icon: BarChart3 },
  { to: '/settings', label: 'Réglages', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-slate-800 bg-slate-950/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors rounded-md',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200',
                ].join(' ')
              }
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
