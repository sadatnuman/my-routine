import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/my-routine/',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg','apple-touch-icon.png'],
    manifest: {
      id: '/my-routine/', name: 'My Routine', short_name: 'My Routine', description: 'Your day, organized.',
      start_url: '/my-routine/', scope: '/my-routine/', display: 'standalone',
      theme_color: '#304b37', background_color: '#f8faf6',
      icons: [
        { src: '/my-routine/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/my-routine/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/my-routine/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'], navigateFallback: '/my-routine/index.html', cleanupOutdatedCaches: true, clientsClaim: false, skipWaiting: false },
  })],
  test: { environment: 'jsdom' },
})
