import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { toast } from '../../store/useToastStore.js';
import Button from '../ui/Button.jsx';

// Bouton "Se déconnecter" avec confirmation à 2 clics (auto-annulée après 4s).
// Utilisé dans Dashboard, Courses et Settings pour garder un comportement
// uniforme partout dans l'app.
export default function SignOutButton({
  className = '',
  size = 'md',
  variant = 'ghost',
}) {
  const signOut = useAuthStore((s) => s.signOut);
  const loading = useAuthStore((s) => s.loading);
  const [confirm, setConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = async () => {
    if (!confirm) {
      setConfirm(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setConfirm(false), 4000);
      return;
    }
    clearTimeout(timerRef.current);
    await signOut();
    toast.show('Déconnecté');
  };

  return (
    <div className={className}>
      <Button
        variant={confirm ? 'danger' : variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 ring-1 ring-slate-800"
      >
        <LogOut size={16} aria-hidden />
        {confirm ? 'Confirmer la déconnexion ?' : 'Se déconnecter'}
      </Button>
      {confirm && (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timerRef.current);
            setConfirm(false);
          }}
          className="mt-1 w-full text-center text-[11px] text-slate-500 hover:text-slate-300"
        >
          Annuler
        </button>
      )}
    </div>
  );
}
