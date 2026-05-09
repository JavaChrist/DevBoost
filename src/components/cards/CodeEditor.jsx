// Mini wrapper CodeMirror 6 — léger, mobile-first, thème aligné DevBoost.
//
// Le parent utilise `key={card.id}` pour forcer un remount entre cartes
// (évite la complexité d'une reconciliation de l'état CM en cas de starterCode différent).

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import {
  HighlightStyle,
  syntaxHighlighting,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const editorTheme = EditorView.theme(
  {
    '&': {
      color: '#e2e8f0',
      backgroundColor: '#0f172a',
      fontSize: '13px',
      borderRadius: '12px',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': {
      caretColor: '#34d399',
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      padding: '12px 0',
    },
    '.cm-cursor': { borderLeftColor: '#34d399', borderLeftWidth: '2px' },
    '.cm-gutters': {
      backgroundColor: '#0b1220',
      color: '#475569',
      border: 'none',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
    },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#94a3b8' },
    '.cm-activeLine': { backgroundColor: 'rgba(51,65,85,0.3)' },
    '.cm-selectionMatch, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(52,211,153,0.25) !important',
    },
    '.cm-line': { padding: '0 12px' },
    '.cm-scroller': { overflow: 'auto' },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#f472b6' }, // pink-400
  { tag: [t.string, t.special(t.string)], color: '#34d399' }, // emerald-400
  { tag: [t.number, t.bool, t.null], color: '#fbbf24' }, // amber-400
  { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: t.function(t.variableName), color: '#60a5fa' }, // blue-400
  { tag: t.variableName, color: '#e2e8f0' },
  { tag: t.operator, color: '#94a3b8' },
  { tag: t.propertyName, color: '#a78bfa' }, // violet-400
  { tag: t.punctuation, color: '#94a3b8' },
]);

export default function CodeEditor({ initialValue = '', onChange, minHeight = 180, readOnly = false }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((u) => {
      if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
    });

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        indentOnInput(),
        highlightActiveLine(),
        syntaxHighlighting(highlightStyle),
        javascript(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        editorTheme,
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({ state, parent: hostRef.current });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // initialValue n'est volontairement utilisé qu'au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      className="w-full min-w-0 max-w-full overflow-hidden rounded-xl ring-1 ring-slate-800"
      style={{ minHeight }}
    />
  );
}
