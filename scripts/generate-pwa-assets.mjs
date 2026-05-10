// Génère le set d'icônes PWA depuis public/logo.svg via sharp.
// Usage : npm run gen:icons
//
// Produit : logo16/32/48/64/96/128/192/256/384/512.png + apple-touch-icon.png
// (apple-touch-icon-3d.png et favicon.ico sont des artworks fournis manuellement
//  et ne sont PAS écrasés par ce script.)
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC = 'public/logo.svg';
const BG = '#020617'; // slate-950

const SIZES = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];

await fs.access(SRC).catch(() => {
  console.error(`[icons] ${SRC} introuvable`);
  process.exit(1);
});

for (const size of SIZES) {
  const file = `public/logo${size}.png`;
  await sharp(SRC).resize(size, size).png().toFile(file);
  const stat = await fs.stat(file);
  console.log(`[icons] ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// apple-touch-icon : 180x180 sur fond opaque (iOS n'aime pas la transparence).
const innerBuf = await sharp(SRC).resize(180, 180).png().toBuffer();
await sharp({
  create: { width: 180, height: 180, channels: 4, background: BG },
})
  .composite([{ input: innerBuf, gravity: 'center' }])
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('[icons] public/apple-touch-icon.png');

console.log('[icons] OK — set complet généré.');
