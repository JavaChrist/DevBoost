// Génère le set d'icônes PWA + splash screens iOS depuis public/logo.svg.
// Usage :
//   npm run gen:icons          → génère uniquement ce qui manque (safe)
//   npm run gen:icons -- --force → ré-génère TOUT (écrase les fichiers)
//
// Produit :
//   - logo{16…512}.png         (regénéré uniquement si absent)
//   - apple-touch-icon.png     (regénéré uniquement si absent)
//   - apple-splash-{w}x{h}.png (toujours regénérés — assets script-only)
//
// (apple-touch-icon-3d.png et favicon.ico sont des artworks fournis
//  manuellement et ne sont JAMAIS touchés par ce script.)
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC = 'public/logo.svg';
const BG = '#020617'; // slate-950 (cohérent avec theme_color du manifest)

const SIZES = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];

// Modèles iOS à couvrir. Format : [width, height, ratio, label]
// (le label sert juste au log, les noms de fichier utilisent w x h)
// Liste basée sur les apple-touch-startup-image standards 2023+.
const SPLASH = [
  // iPhone Pro Max / Plus
  [1290, 2796, 3, 'iPhone 15 Pro Max'],
  [1179, 2556, 3, 'iPhone 15 Pro'],
  [1284, 2778, 3, 'iPhone 14 Plus'],
  [1170, 2532, 3, 'iPhone 13/14'],
  [1125, 2436, 3, 'iPhone X/XS/11 Pro'],
  [828, 1792, 2, 'iPhone XR/11'],
  [750, 1334, 2, 'iPhone 6/7/8'],
  // iPad
  [2048, 2732, 2, 'iPad Pro 12.9'],
  [1668, 2388, 2, 'iPad Pro 11'],
  [1640, 2360, 2, 'iPad Air'],
  [1536, 2048, 2, 'iPad mini'],
];

await fs.access(SRC).catch(() => {
  console.error(`[icons] ${SRC} introuvable`);
  process.exit(1);
});

const FORCE = process.argv.includes('--force');

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// --- Icônes carrées ---
for (const size of SIZES) {
  const file = `public/logo${size}.png`;
  if (!FORCE && (await exists(file))) {
    console.log(`[icons] ${file} déjà présent → skip (utilise --force pour écraser)`);
    continue;
  }
  await sharp(SRC).resize(size, size).png().toFile(file);
  const stat = await fs.stat(file);
  console.log(`[icons] ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// --- apple-touch-icon : 180x180 sur fond opaque ---
const appleIcon = 'public/apple-touch-icon.png';
if (FORCE || !(await exists(appleIcon))) {
  const innerBuf = await sharp(SRC).resize(180, 180).png().toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: BG },
  })
    .composite([{ input: innerBuf, gravity: 'center' }])
    .png()
    .toFile(appleIcon);
  console.log(`[icons] ${appleIcon}`);
} else {
  console.log(`[icons] ${appleIcon} déjà présent → skip`);
}

// --- Splash screens iOS ---
// Logo centré occupant ~30% de la plus petite dimension, fond plein BG.
for (const [w, h, , label] of SPLASH) {
  const logoSize = Math.round(Math.min(w, h) * 0.3);
  const logoBuf = await sharp(SRC).resize(logoSize, logoSize).png().toBuffer();
  const file = `public/apple-splash-${w}x${h}.png`;
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toFile(file);
  const stat = await fs.stat(file);
  console.log(`[splash] ${file} (${(stat.size / 1024).toFixed(1)} KB) — ${label}`);
}

console.log('[icons] OK — set complet généré.');
