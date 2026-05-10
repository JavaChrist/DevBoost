import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { useAuthStore } from '../../store/useAuthStore.js';
import { toast } from '../../store/useToastStore.js';
import { deleteAccount } from '../../lib/account.js';

const CONFIRM_PHRASE = 'SUPPRIMER';

export default function DeleteAccountDialog({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setConfirm('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const canDelete =
    !loading && confirm.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    setError(null);
    try {
      await deleteAccount();
      toast.show('Compte supprimé. À bientôt.');
      onClose?.();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Supprimer mon compte"
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            disabled={!canDelete}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Suppression…
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-500/30">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-400" aria-hidden />
          <div>
            <p className="font-bold text-rose-300">Cette action est irréversible.</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
              Ton compte, ton historique de sessions, ton XP, ton streak, ta
              progression dans les cours et toutes tes cartes personnelles seront
              effacés <strong>immédiatement et définitivement</strong>, côté serveur
              comme sur cet appareil.
            </p>
          </div>
        </div>

        {user?.email && (
          <p className="text-slate-400">
            Compte concerné :{' '}
            <span className="font-mono text-slate-200">{user.email}</span>
          </p>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="confirm-phrase"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Pour confirmer, tape{' '}
            <span className="font-mono text-rose-300">{CONFIRM_PHRASE}</span>
          </label>
          <input
            id="confirm-phrase"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck="false"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            placeholder={CONFIRM_PHRASE}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-base font-mono text-slate-100 placeholder:text-slate-600 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-500/30"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
