import { useState } from 'react';
import { Check } from 'lucide-react';
import db from '../../db/dexie.js';
import { parseImport } from '../../lib/cards.js';
import { toast } from '../../store/useToastStore.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const PLACEHOLDER = `[
  {
    "theme": "javascript",
    "type": "quiz",
    "question": "Que renvoie typeof null ?",
    "choices": ["null", "object", "undefined", "number"],
    "answer": 1,
    "explanation": "Bug historique JS",
    "difficulty": 1
  }
]`;

export default function ImportDialog({ open, onClose, onImported }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null); // { cards, errors } | null

  const handlePreview = () => {
    setPreview(parseImport(text));
  };

  const handleImport = async () => {
    const r = preview ?? parseImport(text);
    if (r.cards.length === 0) {
      setPreview(r);
      toast.error('Aucune carte valide à importer');
      return;
    }
    await db.cards.bulkAdd(r.cards);
    toast.success(`${r.cards.length} carte${r.cards.length > 1 ? 's' : ''} importée${r.cards.length > 1 ? 's' : ''}`);
    onImported?.(r.cards.length);
    setText('');
    setPreview(null);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importer des cartes (JSON)"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={handlePreview} className="ring-1 ring-slate-800">
            Vérifier
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleImport}
            disabled={!text.trim()}
          >
            Importer{preview?.cards.length ? ` (${preview.cards.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-400">
          Colle un tableau JSON de cartes. Chaque carte doit avoir au minimum <code>theme</code>,{' '}
          <code>type</code> (quiz | challenge), <code>difficulty</code> et les champs propres au
          type.
        </p>
        <textarea
          rows={12}
          spellCheck={false}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
          }}
          placeholder={PLACEHOLDER}
          className="w-full rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        />
        {preview && (
          <div className="flex flex-col gap-2">
            <p className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <Check size={14} aria-hidden /> {preview.cards.length} carte
              {preview.cards.length > 1 ? 's' : ''} valide{preview.cards.length > 1 ? 's' : ''}
            </p>
            {preview.errors.length > 0 && (
              <ul className="rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300 ring-1 ring-rose-400/30">
                {preview.errors.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
