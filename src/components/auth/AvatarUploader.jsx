import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { toast } from '../../store/useToastStore.js';
import { uploadAvatar, removeAvatar, ACCEPTED_TYPES } from '../../lib/avatar.js';
import Avatar from './Avatar.jsx';

// Bloc avatar éditable : carré avec photo + bouton "Modifier" / "Retirer".
// Au clic sur Modifier → ouvre un file picker. Au choix d'un fichier :
// resize 256x256 JPEG → upload Supabase Storage → update user_metadata
// → refreshProfile() pour propager dans le UserMenu et partout.
export default function AvatarUploader() {
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const triggerPick = () => {
    if (busy || !user?.id) return;
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset pour pouvoir re-uploader le même fichier
    if (!file) return;

    setBusy(true);
    try {
      await uploadAvatar(user.id, file);
      await refreshProfile();
      toast.success('Avatar mis à jour');
    } catch (err) {
      toast.error(err.message || "Échec de l'upload");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy || !user?.id || !user.avatarUrl) return;
    setBusy(true);
    try {
      await removeAvatar(user.id);
      await refreshProfile();
      toast.show('Avatar retiré');
    } catch (err) {
      toast.error(err.message || 'Échec de la suppression');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={triggerPick}
        disabled={busy}
        aria-label="Modifier l'avatar"
        className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      >
        <Avatar user={user} size={72} />
        <span
          className={[
            'absolute inset-0 grid place-items-center rounded-full bg-slate-950/60 text-emerald-300 transition-opacity',
            busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          {busy ? (
            <Loader2 size={22} className="animate-spin" aria-hidden />
          ) : (
            <Camera size={22} aria-hidden />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-300">Photo de profil</p>
        <p className="mb-2 text-[11px] text-slate-500">
          Carré, recadré et compressé en 256×256 JPEG. Visible côté serveur.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={triggerPick}
            disabled={busy}
            className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 disabled:opacity-50"
          >
            {user.avatarUrl ? 'Changer' : 'Choisir une image'}
          </button>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Trash2 size={12} aria-hidden />
              Retirer
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFile}
        className="hidden"
        aria-hidden
      />
    </div>
  );
}
