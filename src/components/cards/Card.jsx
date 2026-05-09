import { lazy, Suspense } from 'react';
import QuizCard from './QuizCard.jsx';

// Lazy : CodeMirror (~150 KB gzip) reste hors du bundle initial.
// Chargé uniquement quand on tombe sur une carte de type 'challenge'.
const ChallengeCard = lazy(() => import('./ChallengeCard.jsx'));

function ChallengeFallback() {
  return (
    <article className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-800" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-800" />
    </article>
  );
}

export default function Card({ card, onAnswer }) {
  if (!card) return null;
  if (card.type === 'quiz') return <QuizCard key={card.id} card={card} onAnswer={onAnswer} />;
  if (card.type === 'challenge')
    return (
      <Suspense fallback={<ChallengeFallback />}>
        <ChallengeCard key={card.id} card={card} onAnswer={onAnswer} />
      </Suspense>
    );
  return (
    <article className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
      <p className="text-center text-slate-400">Type de carte inconnu : {card.type}</p>
    </article>
  );
}
