import { useEffect, useState } from 'react';
import db from '../../db/dexie.js';
import { KNOWN_THEMES, validateCard } from '../../lib/cards.js';
import { toast } from '../../store/useToastStore.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import QuizEditor from './QuizEditor.jsx';
import ChallengeEditor from './ChallengeEditor.jsx';

const labelCls = 'text-xs font-semibold uppercase tracking-widest text-slate-400';

export default function CardEditor({ open, card, onClose, onSaved }) {
  const [draft, setDraft] = useState(card);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(card);
    setRawText(JSON.stringify(card, null, 2));
    setRawMode(false);
    setConfirmDelete(false);
  }, [open, card]);

  if (!card) return null;
  const isNew = card.id == null;

  const switchToRaw = () => {
    setRawText(JSON.stringify(draft, null, 2));
    setRawMode(true);
  };

  const switchToForm = () => {
    try {
      const parsed = JSON.parse(rawText);
      setDraft(parsed);
      setRawMode(false);
    } catch (e) {
      alert(`JSON invalide : ${e.message}`);
    }
  };

  const handleSave = async () => {
    let toSave = draft;
    if (rawMode) {
      try {
        toSave = JSON.parse(rawText);
      } catch (e) {
        alert(`JSON invalide : ${e.message}`);
        return;
      }
    }
    const v = validateCard(toSave);
    if (!v.ok) {
      toast.error(`Carte invalide : ${v.errors[0]}`);
      return;
    }
    if (isNew) {
      await db.cards.add(toSave);
      toast.success('Carte créée');
    } else {
      const { id, ...patch } = toSave;
      void id;
      await db.cards.update(card.id, patch);
      toast.success('Carte sauvegardée');
    }
    onSaved?.();
    onClose?.();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await db.cards.delete(card.id);
    toast.show('Carte supprimée');
    onSaved?.();
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Nouvelle carte' : 'Modifier la carte'}
      footer={
        <>
          {!isNew && (
            <Button
              variant={confirmDelete ? 'danger' : 'ghost'}
              size="md"
              onClick={handleDelete}
              className="ring-1 ring-slate-800"
            >
              {confirmDelete ? 'Confirmer ?' : 'Supprimer'}
            </Button>
          )}
          <Button variant="primary" size="md" className="flex-1" onClick={handleSave}>
            Sauver
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-1 flex flex-col gap-1">
            <span className={labelCls}>Type</span>
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              disabled={!isNew}
              className="rounded-lg bg-slate-950 px-2 py-2 text-sm text-slate-100 ring-1 ring-slate-800 disabled:opacity-60"
            >
              <option value="quiz">Quiz</option>
              <option value="challenge">Challenge</option>
            </select>
          </label>
          <label className="col-span-1 flex flex-col gap-1">
            <span className={labelCls}>Thème</span>
            <input
              type="text"
              list="known-themes"
              value={draft.theme}
              onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
              className="rounded-lg bg-slate-950 px-2 py-2 text-sm text-slate-100 ring-1 ring-slate-800"
            />
            <datalist id="known-themes">
              {KNOWN_THEMES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className="col-span-1 flex flex-col gap-1">
            <span className={labelCls}>Difficulté</span>
            <select
              value={draft.difficulty}
              onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}
              className="rounded-lg bg-slate-950 px-2 py-2 text-sm text-slate-100 ring-1 ring-slate-800"
            >
              <option value={1}>1 — facile</option>
              <option value={2}>2 — moyen</option>
              <option value={3}>3 — dur</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={rawMode ? switchToForm : switchToRaw}
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-800 hover:bg-slate-800"
          >
            {rawMode ? '← Formulaire' : 'JSON brut →'}
          </button>
        </div>

        {rawMode ? (
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        ) : draft.type === 'quiz' ? (
          <QuizEditor value={draft} onChange={setDraft} />
        ) : (
          <ChallengeEditor value={draft} onChange={setDraft} />
        )}
      </div>
    </Modal>
  );
}
