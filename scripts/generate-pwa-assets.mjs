// Génère les icônes PWA depuis public/logo.svg via sharp.
// Usage : npm run gen:icons
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC = 'public/logo.svg';
const BG = '#020617'; // slate-950

const targets = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180, background: BG },
  // maskable : safe zone = 80% centre
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
];

await fs.access(SRC).catch(() => {
  console.error(`[icons] ${SRC} introuvable`);
  process.exit(1);
});

for (const t of targets) {
  const file = `public/${t.name}`;
  if (t.maskable) {
    const inner = Math.round(t.size * 0.8);
    const innerBuf = await sharp(SRC).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: t.size, height: t.size, channels: 4, background: BG },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png()
      .toFile(file);
  } else if (t.background) {
    const innerBuf = await sharp(SRC).resize(t.size, t.size).png().toBuffer();
    await sharp({
      create: { width: t.size, height: t.size, channels: 4, background: t.background },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png()
      .toFile(file);
  } else {
    await sharp(SRC).resize(t.size, t.size).png().toFile(file);
  }
  const stat = await fs.stat(file);
  console.log(`[icons] ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log('[icons] OK — toutes les icônes PWA sont générées.');
