import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sample-datasets/*.csv'],
      manifest: {
        name: 'Pocket Data Visualizer',
        short_name: 'DataViz',
        description: 'Privacy-first, in-browser CSV data visualizer',
        theme_color: '#6366f1',
        background_color: '#0a0b0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,csv}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],

  // ── Vitest configuration ──────────────────────────────────────────────────
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'vmThreads',
    setupFiles: [],
    include: ['tests/**/*.test.{js,jsx}'],
    testTimeout: 15000,
  },
});
