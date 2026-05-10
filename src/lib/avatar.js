// DevBoost — gestion des avatars utilisateur via Supabase Storage.
//
// Convention de chemin : avatars/{userId}/avatar.jpg
//
// Pipeline d'upload :
//   1. fichier sélectionné (n'importe quel type image)
//   2. resize côté client en 256x256 JPEG qualité 0.85 (canvas)
//      → garantit < 30 KB en moyenne, économie réseau + storage
//   3. upload (upsert) dans le bucket "avatars"
//   4. récup URL publique
//   5. update auth.users.user_metadata.avatar_url
//
// L'URL publique inclut un cache-buster ?v=timestamp pour forcer le
// rafraîchissement après écrasement (sinon le navigateur servirait
// l'ancienne image en cache).

import { supabase, isSupabaseConfigured } from './supabase.js';

const BUCKET = 'avatars';
const TARGET_SIZE = 256;
const QUALITY = 0.85;
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB hard limit

export const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

// Resize/crop l'image en carré 256x256 via canvas, sortie en JPEG Blob.
async function resizeToSquare(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image trop lourde (max 8 Mo).');
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Impossible de lire l'image.");
  });

  // Crop centré pour avoir un carré, puis scale en TARGET_SIZE.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.round((bitmap.width - side) / 2);
  const sy = Math.round((bitmap.height - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  if (!blob) throw new Error("Échec de la conversion de l'image.");
  return blob;
}

export async function uploadAvatar(userId, file) {
  if (!isSupabaseConfigured) throw new Error('Supabase non configuré.');
  if (!userId) throw new Error('Utilisateur non authentifié.');

  const blob = await resizeToSquare(file);
  const path = `${userId}/avatar.jpg`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/jpeg',
    });
  if (upErr) throw new Error(upErr.message || "Échec de l'upload.");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-buster pour invalider l'ancienne version dans le navigateur.
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  // Persiste l'URL dans le profil Supabase (user_metadata).
  const { error: metaErr } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (metaErr) throw new Error(metaErr.message || 'Échec de la mise à jour du profil.');

  return publicUrl;
}

export async function removeAvatar(userId) {
  if (!isSupabaseConfigured) throw new Error('Supabase non configuré.');
  if (!userId) throw new Error('Utilisateur non authentifié.');

  const path = `${userId}/avatar.jpg`;
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: null },
  });
  if (error) throw new Error(error.message || 'Échec de la mise à jour du profil.');
  return true;
}
