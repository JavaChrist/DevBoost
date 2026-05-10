import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore.js';
import Card from '../components/cards/Card.jsx';
import SwipeableCard from '../components/cards/SwipeableCard.jsx';
import Button from '../components/ui/Button.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { SWIPE_QUALITY } from '../lib/sm2.js';

export default function Session() {
  const navigate = useNavigate();
  const cards = useSessionStore((s) => s.cards);
  const index = useSessionStore((s) => s.index);
  const finishedAt = useSessionStore((s) => s.finishedAt);
  const results = useSessionStore((s) => s.results);
  const answer = useSessionStore((s) => s.answer);
  const reset = useSessionStore((s) => s.reset);

  const [exitDir, setExitDir] = useState(0); // -1 ou +1, transmis à SwipeableCard sortante

  useEffect(() => {
    if (cards.length === 0) navigate('/', { replace: true });
  }, [cards.length, navigate]);

  // Reset la direction de sortie quand on change de carte (le exit prop a déjà été lu).
  useEffect(() => {
    if (exitDir !== 0) {
      const id = setTimeout(() => setExitDir(0), 300);
      return () => clearTimeout(id);
    }
  }, [index, exitDir]);

  if (cards.length === 0) return null;

  if (finishedAt) {
    const passed = results.filter((r) => r.ok).length;
    const xp = results.reduce((s, r) => s + r.xpGained, 0);
    return (
      <section className="flex flex-col items-center gap-6 p-6 text-center">
        <h1 className="inline-flex items-center gap-3 text-3xl font-extrabold tracking-tight text-emerald-400">
          Bravo <PartyPopper size={32} aria-hidden />
        </h1>
        <p className="text-slate-300">
          Session terminée — {passed} / {cards.length} réussies
        </p>
        <p className="text-sm text-slate-400">+{xp} XP</p>
        <Button
          size="lg"
          className="w-full max-w-xs"
          onClick={() => {
            reset();
            navigate('/', { replace: true });
          }}
        >
          Retour à l’accueil
        </Button>
      </section>
    );
  }

  const card = cards[index];

  const swipeRight = () => {
    setExitDir(1);
    answer(SWIPE_QUALITY.ok);
  };
  const swipeLeft = () => {
    setExitDir(-1);
    answer(SWIPE_QUALITY.retry);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-slate-500">
          Carte {index + 1} / {cards.length}
        </span>
        <button
          onClick={() => {
            reset();
            navigate('/', { replace: true });
          }}
          className="text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
        >
          Quitter
        </button>
      </header>
      <ProgressBar value={index} max={cards.length} />

      <div className="relative min-h-[400px] min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <SwipeableCard
            key={card.id}
            onSwipeLeft={swipeLeft}
            onSwipeRight={swipeRight}
            exitDirection={exitDir}
          >
            <Card card={card} onAnswer={answer} />
          </SwipeableCard>
        </AnimatePresence>
      </div>

      {/* Boutons de fallback (accessibilité + desktop sans gestes). */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-stretch gap-2"
      >
        <Button variant="ghost" size="md" className="flex-1 ring-1 ring-slate-800" onClick={swipeLeft}>
          ← À revoir
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="flex-1 ring-1 ring-slate-800"
          onClick={swipeRight}
        >
          OK →
        </Button>
      </motion.div>
      <p className="text-center text-[11px] text-slate-600">
        Astuce : swipe la carte ←/→ ou utilise les boutons ci-dessus
      </p>
    </section>
  );
}
