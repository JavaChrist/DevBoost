import { useEffect, useRef, useState } from 'react';
import FlipCard from './FlipCard.jsx';
import CodeEditor from './CodeEditor.jsx';
import TestList from './TestList.jsx';
import Button from '../ui/Button.jsx';
import { runChallenge } from '../../lib/runner/runChallenge.js';
import { SWIPE_QUALITY } from '../../lib/sm2.js';

export default function ChallengeCard({ card, onAnswer }) {
  const [code, setCode] = useState(card?.starterCode ?? '');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [outcome, setOutcome] = useState(null); // 'success' | 'gave_up' | null

  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    setCode(card?.starterCode ?? '');
    setResults(null);
    setRunning(false);
    setHintOpen(false);
    setOutcome(null);
  }, [card?.id, card?.starterCode]);

  if (!card) return null;

  const allPass =
    results &&
    !results.timedOut &&
    !results.error &&
    results.passed === results.total &&
    results.total > 0;

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    try {
      const report = await runChallenge(codeRef.current, card.tests);
      setResults(report);
      if (report.passed === report.total && !report.error) {
        setOutcome('success');
      }
    } finally {
      setRunning(false);
    }
  };

  const handleGiveUp = () => {
    setOutcome('gave_up');
  };

  const handleContinue = () => {
    onAnswer?.(outcome === 'success' ? SWIPE_QUALITY.ok : SWIPE_QUALITY.retry);
  };

  return (
    <FlipCard
      flipped={outcome !== null}
      front={
        <ChallengeFront
          card={card}
          code={code}
          onCodeChange={setCode}
          results={results}
          running={running}
          hintOpen={hintOpen}
          onToggleHint={() => setHintOpen((h) => !h)}
          onRun={handleRun}
          onGiveUp={handleGiveUp}
          allPass={allPass}
        />
      }
      back={
        <ChallengeBack
          card={card}
          code={code}
          outcome={outcome}
          results={results}
          onContinue={handleContinue}
        />
      }
    />
  );
}

function ChallengeFront({
  card,
  code,
  onCodeChange,
  results,
  running,
  hintOpen,
  onToggleHint,
  onRun,
  onGiveUp,
}) {
  return (
    <article className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800 shadow-card">
      <header className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
          Challenge · {card.theme}
        </span>
        {card.hint && (
          <button
            type="button"
            onClick={onToggleHint}
            className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            {hintOpen ? 'Masquer' : '💡 Astuce'}
          </button>
        )}
      </header>

      <h2 className="whitespace-pre-line break-words text-base font-bold leading-snug tracking-tight">
        {card.prompt}
      </h2>

      {hintOpen && card.hint && (
        <p className="rounded-lg bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-400/20">
          {card.hint}
        </p>
      )}

      <CodeEditor initialValue={code} onChange={onCodeChange} minHeight={160} />

      <TestList tests={card.tests} results={results?.results} running={running} />

      {results?.error && !results.timedOut && (
        <p className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
          {results.error}
        </p>
      )}
      {results?.timedOut && (
        <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300 ring-1 ring-amber-400/30">
          ⏰ {results.error}
        </p>
      )}

      <div className="mt-1 flex items-stretch gap-2">
        <Button
          variant="ghost"
          size="md"
          className="flex-1 ring-1 ring-slate-800"
          onClick={onGiveUp}
          disabled={running}
        >
          Abandonner
        </Button>
        <Button variant="primary" size="md" className="flex-[2]" onClick={onRun} disabled={running}>
          {running ? 'Exécution…' : 'Run'}
          {results && !running && (
            <span className="ml-1 text-xs font-bold opacity-90">
              · {results.passed}/{results.total}
            </span>
          )}
        </Button>
      </div>
    </article>
  );
}

function ChallengeBack({ card, code, outcome, results, onContinue }) {
  const success = outcome === 'success';
  return (
    <article
      className={[
        'flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-2xl p-5 ring-1 shadow-card',
        success ? 'bg-emerald-950/40 ring-emerald-500/40' : 'bg-slate-900 ring-slate-800',
      ].join(' ')}
    >
      <header className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Challenge · {card.theme}
        </span>
        <span
          className={[
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
            success ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-300',
          ].join(' ')}
        >
          {success ? '✓ Tous les tests passent' : 'À retravailler'}
        </span>
      </header>

      {success ? (
        <>
          <h2 className="text-2xl font-extrabold tracking-tight text-emerald-300">Bravo 🎉</h2>
          <p className="text-sm text-slate-300">
            {results.passed}/{results.total} tests verts. Cette carte reviendra plus tard, plus
            espacée.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold tracking-tight">Tu reverras cette carte bientôt</h2>
          <p className="text-sm text-slate-400">
            Pas grave : on reverra ce challenge dès demain. {card.hint && `Astuce : ${card.hint}`}
          </p>
        </>
      )}

      <div className="rounded-xl bg-slate-950/60 p-3 ring-1 ring-slate-800">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Ton code
        </p>
        <pre className="overflow-x-auto text-[12px] leading-relaxed text-slate-200">
          <code>{code}</code>
        </pre>
      </div>

      <Button
        size="lg"
        variant={success ? 'primary' : 'secondary'}
        className="mt-1 w-full"
        onClick={onContinue}
      >
        Continuer
      </Button>
    </article>
  );
}
