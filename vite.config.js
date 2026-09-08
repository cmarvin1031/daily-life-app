import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project at /daily-life-app/, but keep the dev
  // server at the root so `npm run dev` works without the extra path.
  base: command === 'build' ? '/daily-life-app/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Daily Life',
        short_name: 'Daily Life',
        description: 'Daily planner, habit tracker, journal, and goals',
        theme_color: '#0F3D2E',
        background_color: '#F5F6F8',
        display: 'standalone',
        start_url: command === 'build' ? '/daily-life-app/' : '/',
        scope: command === 'build' ? '/daily-life-app/' : '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
}))
