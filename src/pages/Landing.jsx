import { Link } from 'react-router-dom';
import {
  Zap,
  Brain,
  Trophy,
  WifiOff,
  Smartphone,
  Code2,
  Check,
  Flame,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

// SVG inline du logo GitHub : lucide-react ne fournit plus les icônes de
// marques (GitHub, Twitter, etc.) depuis le rebranding 1.0.
function GithubIcon({ size = 14, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Sessions courtes',
    body: '5 minutes par jour suffisent. Parfait entre deux compilations ou dans le métro.',
  },
  {
    icon: Brain,
    title: 'Répétition espacée',
    body: 'Algorithme SuperMemo SM-2 : les cartes ratées reviennent plus vite, les acquises s’espacent.',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    body: 'Streak, XP, niveaux : on s’accroche pour ne pas casser sa série.',
  },
  {
    icon: WifiOff,
    title: '100 % offline',
    body: 'Tout est local après la première visite. Avion, métro, montagne : ça marche.',
  },
  {
    icon: Smartphone,
    title: 'Installable PWA',
    body: 'Ajoute DevBoost à ton écran d’accueil iOS ou Android, comme une vraie app.',
  },
  {
    icon: Code2,
    title: 'Vrais challenges code',
    body: 'Pas que du QCM : tu écris du JavaScript et il s’exécute dans un Web Worker isolé.',
  },
];

const STATS = [
  { value: '6', label: 'thèmes' },
  { value: '24', label: 'cours' },
  { value: '96', label: 'cartes' },
];

const THEMES = [
  { label: 'HTML', color: 'bg-orange-500/15 text-orange-300 ring-orange-400/30' },
  { label: 'CSS', color: 'bg-sky-500/15 text-sky-300 ring-sky-400/30' },
  { label: 'JavaScript', color: 'bg-amber-400/15 text-amber-300 ring-amber-400/30' },
  { label: 'React', color: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/30' },
  { label: 'Algo', color: 'bg-violet-500/15 text-violet-300 ring-violet-400/30' },
  { label: 'IA & Agents', color: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' },
];

const STEPS = [
  { n: '1', title: 'Crée ton compte', body: 'Email + prénom, c’est gratuit.' },
  { n: '2', title: 'Choisis tes thèmes', body: 'Sélectionne ce que tu veux travailler.' },
  { n: '3', title: 'Une session par jour', body: 'L’algo te donne juste ce qu’il faut.' },
];

export default function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-5 py-6 md:py-10">
      <TopBar />
      <Hero />
      <MockupPreview />
      <FeaturesGrid />
      <StatsBlock />
      <ThemesBlock />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img
          src="/logo48.png"
          alt="DevBoost"
          width="36"
          height="36"
          className="h-9 w-9 rounded-xl shadow-card ring-1 ring-slate-800"
        />
        <span className="text-base font-extrabold tracking-tight">DevBoost</span>
      </div>
      <Link
        to="/login"
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-slate-800 transition-colors hover:bg-slate-800"
      >
        Se connecter
      </Link>
    </header>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
        <Sparkles size={12} aria-hidden /> PWA · 100 % offline
      </span>
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Reste au top en{' '}
        <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
          5 minutes par jour
        </span>
      </h1>
      <p className="max-w-xl text-pretty text-sm text-slate-400 md:text-base">
        DevBoost te fait réviser HTML, CSS, JavaScript, React, Algo et IA via des sessions courtes
        de quiz et de mini-challenges code. Répétition espacée et gamification incluses.
      </p>
      <div className="mt-2 flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/login?tab=signup"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-card transition-colors hover:bg-emerald-400 sm:w-auto"
        >
          Commencer gratuitement <ArrowRight size={16} aria-hidden />
        </Link>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-800 transition-colors hover:bg-slate-800 sm:w-auto"
        >
          J&apos;ai déjà un compte
        </Link>
      </div>
      <p className="text-[11px] text-slate-500">
        Aucune carte bancaire · Mobile + desktop · Open source
      </p>
    </section>
  );
}

// Mockup visuel d'une vraie carte challenge + d'un streak, pour donner un
// aperçu de l'app sans avoir à inclure des captures PNG (qui dateraient).
function MockupPreview() {
  return (
    <section className="relative isolate flex flex-col items-center">
      <div className="grid w-full gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
              Challenge · React
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              + 15 XP
            </span>
          </div>
          <p className="text-sm font-bold text-slate-100">
            Écris <span className="font-mono text-emerald-300">classNames(…args)</span> qui prend
            une liste de classes CSS et renvoie une seule chaîne.
          </p>
          <pre className="mt-3 overflow-hidden rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-300 ring-1 ring-slate-800">
            <code>
              <span className="text-pink-400">function</span>{' '}
              <span className="text-blue-400">classNames</span>
              <span className="text-slate-400">(</span>
              <span className="text-slate-200">...args</span>
              <span className="text-slate-400">) {'{'}</span>
              {'\n  '}
              <span className="text-pink-400">return</span>{' '}
              <span className="text-emerald-300">&apos;&apos;</span>
              <span className="text-slate-400">;</span>
              {'\n'}
              <span className="text-slate-400">{'}'}</span>
            </code>
          </pre>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Check size={12} className="text-emerald-400" aria-hidden /> 3 / 3 tests
            </span>
            <span>Clique pour exécuter →</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Streak
            </p>
            <p className="mt-1 inline-flex items-baseline gap-2 text-3xl font-extrabold text-slate-100">
              12 <Flame size={20} className="text-amber-400" aria-hidden />
            </p>
            <p className="mt-1 text-[11px] text-slate-500">jours consécutifs</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
            <div className="flex items-baseline justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Niveau 4</span>
              <span>72 / 100 XP</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[72%] rounded-full bg-emerald-400" />
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-400/30">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles size={12} aria-hidden /> Tu es à jour. Une session de plus pour rester
              chaud.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        eyebrow="Pourquoi ça marche"
        title="Pensé pour les devs occupés"
        subtitle="Les bons outils, et rien de plus."
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card transition-colors hover:bg-slate-800/60"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <f.icon size={18} aria-hidden />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-100">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsBlock() {
  return (
    <section className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/40 p-5 ring-1 ring-slate-800 shadow-card md:p-8">
      <div className="grid grid-cols-3 gap-2 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold text-emerald-300 md:text-4xl">{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemesBlock() {
  return (
    <section className="flex flex-col items-center gap-3 text-center">
      <SectionHeader
        eyebrow="Le contenu"
        title="6 thèmes, du débutant au confirmé"
        subtitle="HTML, CSS, JavaScript, React, Algo et IA. Chaque thème = 4 cours détaillés + 16 cartes."
        align="center"
      />
      <div className="flex flex-wrap justify-center gap-2">
        {THEMES.map((t) => (
          <span
            key={t.label}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${t.color}`}
          >
            {t.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        eyebrow="Comment ça marche"
        title="3 étapes, et c’est tout"
        align="center"
      />
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-sm font-extrabold text-slate-950">
              {s.n}
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-100">{s.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-slate-900 p-6 text-center ring-1 ring-emerald-400/30 shadow-card md:p-10">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
        Prêt à reprendre tes révisions ?
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        Crée ton compte, ouvre une session, et garde ta série.
      </p>
      <Link
        to="/login?tab=signup"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-card transition-colors hover:bg-emerald-400"
      >
        Commencer maintenant <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 pb-2 pt-6 text-[11px] text-slate-500 sm:flex-row">
      <p>DevBoost © {new Date().getFullYear()} · MVP open source</p>
      <a
        href="https://github.com/JavaChrist/DevBoost"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 hover:text-slate-300"
      >
        <GithubIcon size={14} /> GitHub
      </a>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, subtitle, align = 'left' }) {
  return (
    <div
      className={[
        'flex flex-col gap-1.5',
        align === 'center' ? 'items-center text-center' : 'items-start',
      ].join(' ')}
    >
      {eyebrow && (
        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">{title}</h2>
      {subtitle && <p className="max-w-xl text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
