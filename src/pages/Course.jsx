import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Lightbulb } from 'lucide-react';
import db from '../db/dexie.js';
import {
  setLastSection,
  markCompleted,
  getProgress,
} from '../lib/courses.js';
import { useSessionStore } from '../store/useSessionStore.js';
import { toast } from '../store/useToastStore.js';
import Button from '../components/ui/Button.jsx';
import CodeBlock from '../components/courses/CodeBlock.jsx';

export default function Course() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const course = useLiveQuery(() => db.courses.where('slug').equals(slug).first(), [slug]);
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate l'index depuis la progression sauvée (1 fois).
  useEffect(() => {
    if (!course || hydrated) return;
    (async () => {
      const p = await getProgress(db, slug);
      if (p && p.lastSection != null && p.lastSection >= 0) {
        setIndex(Math.min(p.lastSection, (course.sections?.length ?? 1) - 1));
      }
      setHydrated(true);
    })();
  }, [course, slug, hydrated]);

  // Persiste la position quand on change de section.
  useEffect(() => {
    if (!course || !hydrated) return;
    setLastSection(db, slug, index);
  }, [index, course, slug, hydrated]);

  if (course === undefined) {
    return (
      <section className="flex flex-col gap-3 p-4">
        <div className="h-6 w-32 animate-pulse rounded-md bg-slate-800/70" />
        <div className="h-32 w-full animate-pulse rounded-xl bg-slate-800/70" />
      </section>
    );
  }
  if (course === null) {
    return (
      <section className="flex flex-col gap-3 p-6 text-center">
        <p className="text-sm text-slate-400">Cours introuvable.</p>
        <Button onClick={() => navigate('/courses')}>Retour aux cours</Button>
      </section>
    );
  }

  const sections = course.sections ?? [];
  const total = sections.length;
  const isLast = index === total - 1;
  const showQuiz = course.quiz?.length > 0;
  const inQuizMode = isLast === false ? false : false; // gestion via état séparé ci-dessous
  // L'écran "quiz de fin" est géré comme un index = total
  return (
    <CourseShell
      course={course}
      slug={slug}
      index={index}
      setIndex={setIndex}
      total={total}
      showQuiz={showQuiz}
      inQuizMode={inQuizMode}
      navigate={navigate}
    />
  );
}

function CourseShell({ course, slug, index, setIndex, total, showQuiz, navigate }) {
  // index ∈ [0..total-1] : section ; index === total : quiz final.
  const isQuizScreen = showQuiz && index === total;
  const section = !isQuizScreen ? course.sections[index] : null;
  const progress = !isQuizScreen ? (index + 1) / total : 1;

  return (
    <section className="flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        >
          ← Retour
        </button>
        <p className="text-[11px] uppercase tracking-wider text-slate-500">
          {isQuizScreen ? `Quiz · ${course.title}` : `Section ${index + 1} / ${total}`}
        </p>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <h1 className="text-xl font-extrabold tracking-tight">{course.title}</h1>

      {!isQuizScreen ? (
        <SectionView
          section={section}
          isFirst={index === 0}
          isLast={index === total - 1}
          showQuiz={showQuiz}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(showQuiz ? total : total - 1, i + 1))}
          onFinish={async () => {
            await markCompleted(db, slug);
            toast.success('Cours terminé ✓');
            navigate('/courses');
          }}
        />
      ) : (
        <QuizView
          quiz={course.quiz}
          slug={slug}
          theme={course.theme}
          onBack={() => setIndex(total - 1)}
          onDone={async () => {
            await markCompleted(db, slug);
            toast.success('Cours terminé ✓');
            navigate('/courses');
          }}
        />
      )}
    </section>
  );
}

function SectionView({ section, isFirst, isLast, showQuiz, onPrev, onNext, onFinish }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
      <h2 className="text-base font-bold tracking-tight text-emerald-300">{section.heading}</h2>
      <ProseBody text={section.body} />
      {section.code && <CodeBlock code={section.code.value} lang={section.code.lang} />}

      <div className="mt-2 flex items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={isFirst}>
          ← Précédent
        </Button>

        {isLast ? (
          showQuiz ? (
            <Button size="sm" onClick={onNext}>
              Quiz du cours →
            </Button>
          ) : (
            <Button size="sm" onClick={onFinish}>
              Terminer
              <Check size={14} aria-hidden />
            </Button>
          )
        ) : (
          <Button size="sm" onClick={onNext}>
            Suivant →
          </Button>
        )}
      </div>
    </article>
  );
}

function ProseBody({ text }) {
  // Mini renderer : **gras**, `inline code`, listes à puces (• ou -), titres ###.
  const blocks = useMemo(() => parseBlocks(text ?? ''), [text]);
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-300">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="mt-2 text-sm font-bold text-slate-100">
              {renderInline(block.spans)}
            </h3>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-none space-y-1 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(block.spans)}</p>;
      })}
    </div>
  );
}

function renderInline(spans) {
  return spans.map((seg, j) => {
    if (seg.type === 'bold')
      return (
        <strong key={j} className="text-slate-100">
          {seg.value}
        </strong>
      );
    if (seg.type === 'code')
      return (
        <code
          key={j}
          className="rounded bg-slate-800 px-1 py-0.5 text-[12px] text-emerald-200"
        >
          {seg.value}
        </code>
      );
    return <span key={j}>{seg.value}</span>;
  });
}

function parseInlineLine(line) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ type: 'text', value: line.slice(last, m.index) });
    if (m[2]) out.push({ type: 'bold', value: m[2] });
    else if (m[3]) out.push({ type: 'code', value: m[3] });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ type: 'text', value: line.slice(last) });
  if (out.length === 0) out.push({ type: 'text', value: '' });
  return out;
}

function parseBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', spans: parseInlineLine(line.slice(4)) });
      i++;
      continue;
    }
    if (/^[•\-]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[•\-]\s/.test(lines[i])) {
        items.push(parseInlineLine(lines[i].replace(/^[•\-]\s/, '')));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    blocks.push({ type: 'paragraph', spans: parseInlineLine(line) });
    i++;
  }
  return blocks;
}

function QuizView({ quiz, slug, theme, onBack, onDone }) {
  void slug;
  const [answers, setAnswers] = useState({}); // { qIndex: choiceIndex }
  const [submitted, setSubmitted] = useState(false);
  const startFromDb = useSessionStore((s) => s.startFromDb);

  const allAnswered = quiz.every((_, i) => answers[i] != null);
  const correctCount = quiz.filter((q, i) => answers[i] === q.answer).length;
  const navigate = useNavigate();

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 shadow-card">
      <h2 className="text-base font-bold tracking-tight text-emerald-300">
        Quiz : as-tu bien suivi ?
      </h2>

      <div className="flex flex-col gap-4">
        {quiz.map((q, i) => {
          const sel = answers[i];
          return (
            <fieldset key={i} className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-slate-100">
                {i + 1}. {q.question}
              </legend>
              {q.choices.map((c, ci) => {
                const isSel = sel === ci;
                const isCorrect = ci === q.answer;
                let toneCls = 'bg-slate-800/60 ring-slate-700 hover:bg-slate-800';
                if (submitted) {
                  if (isCorrect) toneCls = 'bg-emerald-500/15 ring-emerald-400/40 text-emerald-200';
                  else if (isSel) toneCls = 'bg-rose-500/15 ring-rose-400/40 text-rose-200';
                  else toneCls = 'bg-slate-800/30 ring-slate-800';
                } else if (isSel) {
                  toneCls = 'bg-emerald-500/15 ring-emerald-400/40 text-emerald-200';
                }
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: ci }))}
                    className={[
                      'rounded-lg px-3 py-2 text-left text-sm ring-1 transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                      toneCls,
                    ].join(' ')}
                  >
                    {c}
                  </button>
                );
              })}
              {submitted && q.explanation && (
                <p className="flex items-start gap-1.5 rounded-md bg-slate-950/50 px-3 py-2 text-[11px] text-slate-400">
                  <Lightbulb size={12} aria-hidden className="mt-0.5 shrink-0" />
                  <span>{q.explanation}</span>
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      {!submitted ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← Sections
          </Button>
          <Button size="sm" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
            Vérifier
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          <p
            className={[
              'rounded-lg px-3 py-2 text-center text-sm font-bold ring-1',
              correctCount === quiz.length
                ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40'
                : 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
            ].join(' ')}
          >
            {correctCount} / {quiz.length} bonne{correctCount > 1 ? 's' : ''} réponse
            {correctCount > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const n = await startFromDb({ themes: [theme] });
                if (n > 0) navigate('/session');
                else toast.error('Aucune carte disponible pour ce thème');
              }}
            >
              Tester en session
            </Button>
            <Button size="sm" onClick={onDone}>
              Terminer
              <Check size={14} aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
