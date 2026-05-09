import { useEffect, useState } from 'react';
import FlipCard from './FlipCard.jsx';
import Button from '../ui/Button.jsx';
import { SWIPE_QUALITY } from '../../lib/sm2.js';

const choiceLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizCard({ card, onAnswer }) {
  const [selected, setSelected] = useState(null);

  // Reset à chaque changement de carte (clé sur card.id côté parent recommandée).
  useEffect(() => {
    setSelected(null);
  }, [card?.id]);

  if (!card) return null;
  const isCorrect = selected === card.answer;
  const flipped = selected !== null;

  const handleSelect = (i) => {
    if (selected !== null) return; // figé après le premier choix
    setSelected(i);
  };

  const handleContinue = () => {
    onAnswer?.(isCorrect ? SWIPE_QUALITY.ok : SWIPE_QUALITY.retry);
  };

  return (
    <FlipCard
      flipped={flipped}
      front={<QuizFront card={card} onSelect={handleSelect} />}
      back={
        <QuizBack
          card={card}
          selected={selected}
          isCorrect={isCorrect}
          onContinue={handleContinue}
        />
      }
    />
  );
}

function QuizFront({ card, onSelect }) {
  return (
    <article className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
        Quiz · {card.theme}
      </span>
      <h2 className="break-words text-lg font-bold leading-snug tracking-tight">{card.question}</h2>

      <ul className="flex flex-col gap-2">
        {card.choices.map((choice, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="group flex w-full items-start gap-3 rounded-xl bg-slate-800/60 p-3 text-left ring-1 ring-slate-800 transition-colors hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300 group-hover:bg-slate-600">
                {choiceLetters[i] ?? i + 1}
              </span>
              <span className="text-sm leading-snug text-slate-100">{choice}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function QuizBack({ card, selected, isCorrect, onContinue }) {
  return (
    <article
      className={[
        'flex w-full min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-2xl p-5 ring-1 shadow-card',
        isCorrect
          ? 'bg-emerald-950/40 ring-emerald-500/40'
          : 'bg-rose-950/30 ring-rose-500/40',
      ].join(' ')}
    >
      <header className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Quiz · {card.theme}
        </span>
        <span
          className={[
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
            isCorrect ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300',
          ].join(' ')}
        >
          {isCorrect ? '✓ Correct' : '✗ Faux'}
        </span>
      </header>

      <h2 className="break-words text-base font-bold leading-snug tracking-tight text-slate-100">
        {card.question}
      </h2>

      <ul className="flex flex-col gap-2">
        {card.choices.map((choice, i) => {
          const isAnswer = i === card.answer;
          const isPicked = i === selected;
          const tone = isAnswer
            ? 'bg-emerald-500/20 ring-emerald-400/60 text-emerald-100'
            : isPicked
              ? 'bg-rose-500/20 ring-rose-400/60 text-rose-100'
              : 'bg-slate-800/40 ring-slate-800 text-slate-400';
          return (
            <li
              key={i}
              className={['flex items-start gap-3 rounded-xl p-3 ring-1', tone].join(' ')}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/40 text-xs font-bold">
                {choiceLetters[i] ?? i + 1}
              </span>
              <span className="text-sm leading-snug">{choice}</span>
              {isAnswer && (
                <span className="ml-auto text-xs font-bold text-emerald-300">✓</span>
              )}
              {!isAnswer && isPicked && (
                <span className="ml-auto text-xs font-bold text-rose-300">✗</span>
              )}
            </li>
          );
        })}
      </ul>

      {card.explanation && (
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Explication
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{card.explanation}</p>
        </div>
      )}

      <Button
        size="lg"
        variant={isCorrect ? 'primary' : 'secondary'}
        className="mt-1 w-full"
        onClick={onContinue}
      >
        Continuer
      </Button>
    </article>
  );
}
