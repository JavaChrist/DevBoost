// Barre tactile au-dessus de l'éditeur pour insérer rapidement les caractères
// pénibles à atteindre sur clavier mobile : { } ( ) [ ] ; = => ' " ` etc.
//
// Reçoit une ref vers un CodeEditor (forwardRef) qui expose insert / insertPair.

const SNIPPETS = [
  { label: '{ }', kind: 'pair', open: '{', close: '}' },
  { label: '( )', kind: 'pair', open: '(', close: ')' },
  { label: '[ ]', kind: 'pair', open: '[', close: ']' },
  { label: '< >', kind: 'pair', open: '<', close: '>' },
  { label: ';', kind: 'text', value: ';' },
  { label: '=', kind: 'text', value: ' = ' },
  { label: '=>', kind: 'text', value: ' => ' },
  { label: '===', kind: 'text', value: ' === ' },
  { label: "' '", kind: 'pair', open: "'", close: "'" },
  { label: '" "', kind: 'pair', open: '"', close: '"' },
  { label: '` `', kind: 'pair', open: '`', close: '`' },
  { label: '.', kind: 'text', value: '.' },
  { label: ',', kind: 'text', value: ', ' },
  { label: 'log', kind: 'pair', open: 'console.log(', close: ')' },
  { label: 'ret', kind: 'text', value: 'return ' },
  { label: 'fn', kind: 'pair', open: 'function ', close: '() {\n  \n}' },
  { label: '↹', kind: 'text', value: '  ' },
];

export default function CodeToolbar({ editorRef, className = '' }) {
  const handle = (s) => {
    const ed = editorRef.current;
    if (!ed) return;
    if (s.kind === 'pair') ed.insertPair(s.open, s.close);
    else ed.insert(s.value);
  };

  return (
    <div
      className={[
        'flex w-full gap-1 overflow-x-auto rounded-lg bg-slate-950/60 p-1 ring-1 ring-slate-800',
        // Scrollbar discrète (Firefox + WebKit) car la barre est scrollable horizontalement.
        '[scrollbar-width:thin] [-webkit-overflow-scrolling:touch]',
        className,
      ].join(' ')}
      role="toolbar"
      aria-label="Caractères de code rapides"
    >
      {SNIPPETS.map((s, i) => (
        <button
          key={i}
          type="button"
          // onMouseDown évite que l'éditeur perde le focus AVANT l'insertion.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handle(s)}
          className="shrink-0 rounded-md bg-slate-800 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-200 active:bg-emerald-500/20 active:text-emerald-200"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
