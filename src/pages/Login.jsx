import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { toast } from '../store/useToastStore.js';
import Button from '../components/ui/Button.jsx';

const TABS = [
  { id: 'signin', label: 'Connexion' },
  { id: 'signup', label: 'Inscription' },
];

function friendlyError(err) {
  if (!err) return null;
  const m = err.message ?? String(err);
  if (/Invalid login credentials/i.test(m)) return 'Email ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(m)) return 'Confirme ton email avant de te connecter.';
  if (/already registered|already exists/i.test(m)) return 'Cet email est déjà utilisé.';
  if (/Password should be at least/i.test(m)) return 'Mot de passe trop court (min. 6 caractères).';
  if (/Unable to validate email/i.test(m)) return 'Email invalide.';
  if (/non configuré/i.test(m)) return m;
  return m;
}

export default function Login() {
  const location = useLocation();
  const fromQuery = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(fromQuery === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const configured = useAuthStore((s) => s.configured);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    clearError();
  }, [tab, clearError]);

  if (user) {
    const dest = location.state?.from?.pathname ?? '/';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!configured) return;
    if (tab === 'signin') {
      const r = await signIn({ email, password });
      if (r.ok) toast.success('Connecté !');
    } else {
      if (!firstName.trim()) {
        return; // l'input required bloque déjà mais sécurité
      }
      const r = await signUp({ firstName, email, password });
      if (r.ok) {
        if (r.needsConfirmation) {
          toast.success('Compte créé. Vérifie ton email pour confirmer.');
          setTab('signin');
        } else {
          toast.success(`Bienvenue ${firstName} !`);
        }
      }
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
        <h1 className="text-3xl font-extrabold tracking-tight">DevBoost</h1>
        <p className="text-sm text-slate-400">Tes sessions de révision, gamifiées.</p>
      </div>

      {!configured && (
        <div className="w-full max-w-sm rounded-xl bg-rose-500/10 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
          <p className="font-semibold">Supabase n&apos;est pas configuré.</p>
          <p className="mt-1 text-xs text-rose-200/80">
            Crée un fichier <code className="rounded bg-rose-500/20 px-1">.env</code> à la racine
            avec <code className="rounded bg-rose-500/20 px-1">VITE_SUPABASE_URL</code> et{' '}
            <code className="rounded bg-rose-500/20 px-1">VITE_SUPABASE_ANON_KEY</code>, puis
            redémarre le serveur de dev.
          </p>
        </div>
      )}

      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
        {/* Tabs */}
        <div role="tablist" className="mb-5 flex rounded-full bg-slate-800/70 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                tab === t.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {tab === 'signup' && (
              <motion.div
                key="firstname"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Field
                  id="firstName"
                  label="Prénom"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Léa"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="lea@example.com"
          />

          <Field
            id="password"
            label="Mot de passe"
            type={showPwd ? 'text' : 'password'}
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="6 caractères minimum"
            trailing={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                title={showPwd ? 'Masquer' : 'Afficher'}
              >
                {showPwd ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            }
          />

          {tab === 'signin' && (
            <div className="-mt-1 text-right">
              <Link
                to="/reset-password"
                className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              {friendlyError(error)}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={loading || !configured}
          >
            {loading ? '…' : tab === 'signin' ? 'Se connecter' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {tab === 'signin' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="font-semibold text-emerald-400 hover:underline"
              >
                Inscris-toi
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => setTab('signin')}
                className="font-semibold text-emerald-400 hover:underline"
              >
                Connecte-toi
              </button>
            </>
          )}
        </p>
      </div>

      <p className="text-center text-[11px] text-slate-600">
        En te connectant tu acceptes le bon usage de DevBoost.{' '}
        <Link to="/" className="underline hover:text-slate-400">
          Retour
        </Link>
      </p>
    </section>
  );
}

function Field({ id, label, trailing, ...rest }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      <div className="relative">
        <input
          id={id}
          {...rest}
          className={[
            'w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm text-slate-100',
            'ring-1 ring-slate-800 placeholder:text-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-emerald-400/70',
            trailing ? 'pr-11' : '',
          ].join(' ')}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>
    </label>
  );
}
