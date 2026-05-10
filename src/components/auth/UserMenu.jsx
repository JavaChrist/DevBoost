import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore.js';
import { toast } from '../../store/useToastStore.js';
import Avatar from './Avatar.jsx';

// Avatar utilisateur (initiale) dans le header. Au clic, ouvre un menu
// déroulant avec : prénom + email, Réglages, Se déconnecter.
// Fermé sur clic extérieur ou touche Escape.
export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    toast.show('Déconnecté');
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu utilisateur"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
      >
        <Avatar user={user} size={40} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-30 mt-2 w-56 origin-top-right rounded-xl bg-slate-900 p-1.5 shadow-card ring-1 ring-slate-800"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-100">
                {user.firstName || 'Sans prénom'}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-slate-800" />
            <MenuItem
              icon={SettingsIcon}
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
            >
              Réglages
            </MenuItem>
            <MenuItem icon={LogOut} variant="danger" onClick={handleSignOut}>
              Se déconnecter
            </MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, variant }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        variant === 'danger'
          ? 'text-rose-300 hover:bg-rose-500/10'
          : 'text-slate-200 hover:bg-slate-800',
      ].join(' ')}
    >
      <Icon size={16} aria-hidden />
      {children}
    </button>
  );
}
