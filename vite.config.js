import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'apple-touch-icon-3d.png',
        'logo.svg',
      ],
      manifest: {
        name: 'DevBoost',
        short_name: 'DevBoost',
        description: "PWA d'entraînement pour développeurs : Quiz + Challenges + SM-2",
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'logo16.png', sizes: '16x16', type: 'image/png' },
          { src: 'logo32.png', sizes: '32x32', type: 'image/png' },
          { src: 'logo48.png', sizes: '48x48', type: 'image/png' },
          { src: 'logo64.png', sizes: '64x64', type: 'image/png' },
          { src: 'logo96.png', sizes: '96x96', type: 'image/png' },
          { src: 'logo128.png', sizes: '128x128', type: 'image/png' },
          { src: 'logo192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'logo256.png', sizes: '256x256', type: 'image/png' },
          { src: 'logo384.png', sizes: '384x384', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'devboost-html',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'devboost-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  worker: {
    format: 'es',
  },
});
