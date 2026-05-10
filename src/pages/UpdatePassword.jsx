import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { toast } from '../store/useToastStore.js';
import Button from '../components/ui/Button.jsx';

function friendlyError(err) {
  if (!err) return null;
  const m = err.message ?? String(err);
  if (/Password should be at least/i.test(m))
    return 'Mot de passe trop court (min. 6 caractères).';
  if (/Auth session missing|JWT/i.test(m))
    return 'Lien expiré ou invalide. Refais une demande de réinitialisation.';
  return m;
}

// Page atterrie après le clic sur le lien dans l'email Supabase :
//   detectSessionInUrl=true + flowType=pkce → la session "recovery" est
//   automatiquement consommée par le client. Une fois `ready` à true,
//   `user` est défini si le lien était valide.
export default function UpdatePassword() {
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const configured = useAuthStore((s) => s.configured);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearError = useAuthStore((s) => s.clearError);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (done) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!configured) return;
    setLocalError(null);
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
      toast.success('Mot de passe mis à jour');
      setDone(true);
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
        <p className="max-w-xs text-center text-sm text-slate-400">
          Choisis un mot de passe que tu pourras retenir.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
        {ready && !user ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-rose-300">
              Lien expiré ou invalide. Refais une demande de réinitialisation.
            </p>
            <Link
              to="/reset-password"
              className="inline-block text-xs font-semibold text-emerald-400 hover:underline"
            >
              Refaire une demande
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <PasswordField
              id="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPwd}
              onToggle={() => setShowPwd((v) => !v)}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm"
              label="Confirmer"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              show={showPwd}
              onToggle={() => setShowPwd((v) => !v)}
              autoComplete="new-password"
            />

            {(localError || error) && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
                {localError ?? friendlyError(error)}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading || !configured}>
              {loading ? '…' : 'Mettre à jour'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function PasswordField({ id, label, show, onToggle, ...rest }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          minLength={6}
          {...rest}
          placeholder="6 caractères minimum"
          className="w-full rounded-xl bg-slate-950 px-3 py-2.5 pr-11 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-1 grid w-9 place-items-center text-slate-400 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </label>
  );
}
