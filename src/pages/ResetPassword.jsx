import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import Button from '../components/ui/Button.jsx';

function friendlyError(err) {
  if (!err) return null;
  const m = err.message ?? String(err);
  if (/Unable to validate email/i.test(m)) return 'Email invalide.';
  if (/non configuré/i.test(m)) return m;
  return m;
}

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const configured = useAuthStore((s) => s.configured);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!configured) return;
    const r = await requestPasswordReset({ email });
    if (r.ok) setSent(true);
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
        <h1 className="text-2xl font-extrabold tracking-tight">Mot de passe oublié</h1>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
        {sent ? (
          <div className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <Mail size={22} aria-hidden />
            </div>
            <p className="text-sm font-semibold text-slate-100">Email envoyé</p>
            <p className="text-xs text-slate-400">
              Si <span className="font-mono text-slate-300">{email}</span> existe, un lien de
              réinitialisation vient d&apos;être envoyé. Vérifie aussi tes spams.
            </p>
            <Link
              to="/login"
              className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Entre ton adresse email. On t&apos;enverra un lien pour choisir un nouveau mot de
              passe.
            </p>

            <label htmlFor="email" className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-300">Email</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lea@example.com"
                className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
                {friendlyError(error)}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading || !configured}>
              {loading ? '…' : 'Envoyer le lien'}
            </Button>

            <p className="pt-2 text-center text-xs text-slate-500">
              <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
