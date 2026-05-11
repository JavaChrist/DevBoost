// Génère le set d'icônes PWA + splash screens iOS.
// Usage :
//   npm run gen:icons          → génère uniquement ce qui manque (safe)
//   npm run gen:icons -- --force → ré-génère TOUT (écrase les fichiers)
//
// Sources :
//   - public/logo512.png (master HD utilisateur, 512x512) → utilisé pour
//     logo-maskable.png et tous les apple-splash-*.png afin d'éviter d'avoir
//     un faux logo. C'est le SEUL master utilisé pour les assets dérivés.
//   - public/logo.svg (placeholder de fallback) → utilisé seulement pour
//     régénérer les petites logoXX.png si elles sont absentes.
//
// Produit :
//   - logo{16…512}.png         (regénéré uniquement si absent ou --force)
//   - apple-touch-icon.png     (regénéré uniquement si absent ou --force)
//   - logo-maskable.png        (TOUJOURS régénéré depuis logo512.png)
//   - apple-splash-{w}x{h}.png (TOUJOURS régénérés depuis logo512.png)
//
// (apple-touch-icon-3d.png et favicon.ico sont des artworks fournis
//  manuellement et ne sont JAMAIS touchés par ce script.)
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC_SVG = 'public/logo.svg'; // fallback pour les petites icônes
const SRC_HD = 'public/logo512.png'; // master HD utilisateur — source de vérité
const BG = '#020617'; // slate-950 (cohérent avec theme_color du manifest)

const SIZES = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];

// Modèles iOS à couvrir. Format : [width, height, ratio, label]
// (le label sert juste au log, les noms de fichier utilisent w x h)
// Liste basée sur les apple-touch-startup-image standards 2023+.
const SPLASH = [
  [1290, 2796, 3, 'iPhone 15 Pro Max'],
  [1179, 2556, 3, 'iPhone 15 Pro'],
  [1284, 2778, 3, 'iPhone 14 Plus'],
  [1170, 2532, 3, 'iPhone 13/14'],
  [1125, 2436, 3, 'iPhone X/XS/11 Pro'],
  [828, 1792, 2, 'iPhone XR/11'],
  [750, 1334, 2, 'iPhone 6/7/8'],
  [2048, 2732, 2, 'iPad Pro 12.9'],
  [1668, 2388, 2, 'iPad Pro 11'],
  [1640, 2360, 2, 'iPad Air'],
  [1536, 2048, 2, 'iPad mini'],
];

await fs.access(SRC_SVG).catch(() => {
  console.error(`[icons] ${SRC_SVG} introuvable`);
  process.exit(1);
});
await fs.access(SRC_HD).catch(() => {
  console.error(`[icons] ${SRC_HD} introuvable — génère d'abord les logos PWA`);
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

// --- Icônes carrées (depuis SVG fallback, jamais écrasées si présentes) ---
for (const size of SIZES) {
  const file = `public/logo${size}.png`;
  if (!FORCE && (await exists(file))) {
    console.log(`[icons] ${file} déjà présent → skip (utilise --force pour écraser)`);
    continue;
  }
  await sharp(SRC_SVG).resize(size, size).png().toFile(file);
  const stat = await fs.stat(file);
  console.log(`[icons] ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// --- apple-touch-icon : 180x180 sur fond opaque ---
// Régénéré depuis le master HD utilisateur (pas le SVG placeholder).
const appleIcon = 'public/apple-touch-icon.png';
if (FORCE || !(await exists(appleIcon))) {
  await sharp(SRC_HD)
    .flatten({ background: BG }) // aplati l'alpha sur fond #020617 → opaque
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(appleIcon);
  console.log(`[icons] ${appleIcon}`);
} else {
  console.log(`[icons] ${appleIcon} déjà présent → skip`);
}

// --- logo-maskable : 512x512 avec safe zone Android ---
// Android crop l'icône maskable dans un cercle/squircle de ~80% du carré.
// Pour éviter "letter-on-background" (icône remplacée par la lettre du nom),
// on rend le logo dans les 60% centraux + fond plein opaque.
// → ALWAYS regenerated, dérivé du master HD utilisateur.
const maskable = 'public/logo-maskable.png';
const inner = Math.round(512 * 0.6);
const innerMaskBuf = await sharp(SRC_HD).resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: BG },
})
  .composite([{ input: innerMaskBuf, gravity: 'center' }])
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile(maskable);
console.log(`[icons] ${maskable} (safe-zone 60%, depuis ${SRC_HD})`);

// --- Splash screens iOS ---
// Logo centré occupant ~30% de la plus petite dimension, fond plein BG.
// Dérivé du master HD utilisateur pour avoir le vrai logo, pas le placeholder.
// PNG indexé (palette) → ~80% plus léger. Aucun impact visuel : le splash
// est un logo sur fond uni, donc une palette de 256 couleurs suffit largement.
for (const [w, h, , label] of SPLASH) {
  const logoSize = Math.round(Math.min(w, h) * 0.3);
  const logoBuf = await sharp(SRC_HD).resize(logoSize, logoSize).png().toBuffer();
  const file = `public/apple-splash-${w}x${h}.png`;
  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(file);
  const stat = await fs.stat(file);
  console.log(`[splash] ${file} (${(stat.size / 1024).toFixed(1)} KB) — ${label}`);
}

console.log('[icons] OK — set complet généré.');
