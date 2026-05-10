import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { toast } from '../store/useToastStore.js';
import Button from '../components/ui/Button.jsx';

// Page atterrie via le lien envoyé par mail. À ce stade Supabase a déjà
// consommé le code de l'URL (detectSessionInUrl=true) et créé une session
// temporaire suffisante pour appeler updateUser({ password }).
function friendlyError(err) {
  if (!err) return null;
  const m = err.message ?? String(err);
  if (/Password should be at least/i.test(m)) return 'Mot de passe trop court (min. 6 caractères).';
  if (/same as the old password/i.test(m)) return 'Choisis un mot de passe différent de l’ancien.';
  if (/Auth session missing/i.test(m))
    return 'Lien expiré ou déjà utilisé. Refais une demande de réinitialisation.';
  if (/non configuré/i.test(m)) return m;
  return m;
}

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [localError, setLocalError] = useState(null);

  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const configured = useAuthStore((s) => s.configured);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Si on a déjà un user en session (ce qui est attendu après l'arrivée
  // depuis le mail) on permet le formulaire. Sinon on affiche un message
  // explicatif (lien expiré ou directement visité sans token).
  const hasRecoverySession = ready && !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!configured) return;
    if (password.length < 6) {
      setLocalError('Mot de passe trop court (min. 6 caractères).');
      return;
    }
    if (password !== confirm) {
      setLocalError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    const r = await updatePassword({ password });
    if (r.ok) {
      toast.success('Mot de passe mis à jour !');
      navigate('/', { replace: true });
    }
  };

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/logo128.png"
          alt="DevBoost"
          width="80"
          height="80"
          className="h-20 w-20 rounded-2xl shadow-card ring-1 ring-slate-800"
        />
        <h1 className="text-2xl font-extrabold tracking-tight">Nouveau mot de passe</h1>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
        {!ready ? (
          <p className="text-center text-sm text-slate-400">Chargement…</p>
        ) : !hasRecoverySession ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-300">
              Ce lien est expiré ou a déjà été utilisé.
            </p>
            <p className="text-xs text-slate-500">
              Demande un nouveau lien de réinitialisation.
            </p>
            <Link
              to="/reset-password"
              className="mt-2 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Recommencer
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Choisis un nouveau mot de passe pour{' '}
              <span className="font-mono text-slate-300">{user?.email}</span>.
            </p>

            <PasswordField
              id="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPwd}
              onToggleShow={() => setShowPwd((v) => !v)}
            />

            <PasswordField
              id="confirm"
              label="Confirme le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              show={showPwd}
              onToggleShow={() => setShowPwd((v) => !v)}
            />

            {(localError || error) && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
                {localError ?? friendlyError(error)}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading || !configured}>
              {loading ? '…' : 'Mettre à jour'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggleShow }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={6}
          value={value}
          onChange={onChange}
          placeholder="6 caractères minimum"
          className="w-full rounded-xl bg-slate-950 px-3 py-2.5 pr-11 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          <button
            type="button"
            onClick={onToggleShow}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={show ? 'Masquer' : 'Afficher'}
          >
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </label>
  );
}
