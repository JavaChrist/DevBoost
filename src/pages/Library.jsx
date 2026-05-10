import { useMemo, useState, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/dexie.js';
import { emptyCard, KNOWN_THEMES } from '../lib/cards.js';
import CardListItem from '../components/library/CardListItem.jsx';
import Button from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';

// CardEditor + ImportDialog importent CodeMirror → on les lazy-load
// pour ne pas alourdir l'ouverture de la Library.
const CardEditor = lazy(() => import('../components/library/CardEditor.jsx'));
const ImportDialog = lazy(() => import('../components/library/ImportDialog.jsx'));

const TYPE_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'challenge', label: 'Code' },
];

export default function Library() {
  const [themeFilter, setThemeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // carte en édition ou null
  const [importOpen, setImportOpen] = useState(false);

  const rawCards = useLiveQuery(() => db.cards.orderBy('theme').toArray(), []);
  const loading = rawCards === undefined;
  const cards = rawCards ?? [];
  const themes = useMemo(() => {
    const set = new Set(KNOWN_THEMES);
    cards.forEach((c) => set.add(c.theme));
    return ['all', ...Array.from(set).sort()];
  }, [cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (themeFilter !== 'all' && c.theme !== themeFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!q) return true;
      const hay =
        (c.question ?? '') + ' ' + (c.prompt ?? '') + ' ' + (c.theme ?? '') + ' ' + (c.hint ?? '');
      return hay.toLowerCase().includes(q);
    });
  }, [cards, themeFilter, typeFilter, search]);

  return (
    <section className="flex flex-col gap-3 p-4 pb-28">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bibliothèque</h1>
          <p className="text-sm text-slate-400">
            {cards.length} carte{cards.length > 1 ? 's' : ''} · {filtered.length} affichée
            {filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          Importer
        </button>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher…"
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {themes.map((th) => (
          <Chip key={th} active={themeFilter === th} onClick={() => setThemeFilter(th)}>
            {th === 'all' ? 'Tous thèmes' : th}
          </Chip>
        ))}
      </div>

      <div className="flex gap-1">
        {TYPE_FILTERS.map((f) => (
          <Chip key={f.id} active={typeFilter === f.id} onClick={() => setTypeFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </>
        ) : cards.length === 0 ? (
          <div className="rounded-xl bg-slate-900/40 p-6 text-center text-sm text-slate-500 ring-1 ring-slate-800">
            <p className="mb-2">Aucune carte en base.</p>
            <p className="text-[11px]">
              Importe un JSON ou crée ta première carte avec le bouton ci-dessous.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl bg-slate-900/40 p-6 text-center text-sm text-slate-500 ring-1 ring-slate-800">
            Aucune carte ne correspond aux filtres actuels.
          </p>
        ) : (
          filtered.map((c) => <CardListItem key={c.id} card={c} onClick={setEditing} />)
        )}
      </div>

      <Button
        size="lg"
        className="sticky bottom-24 self-end shadow-card"
        onClick={() =>
          setEditing(
            emptyCard(
              typeFilter === 'challenge' ? 'challenge' : 'quiz',
              themeFilter !== 'all' ? themeFilter : 'javascript',
            ),
          )
        }
      >
        + Nouvelle
      </Button>

      <Suspense fallback={null}>
        {editing && (
          <CardEditor open={!!editing} card={editing} onClose={() => setEditing(null)} />
        )}
        {importOpen && (
          <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
        )}
      </Suspense>
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors',
        active
          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40'
          : 'bg-slate-900 text-slate-400 ring-slate-800 hover:text-slate-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
