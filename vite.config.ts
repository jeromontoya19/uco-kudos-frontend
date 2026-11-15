/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import { COLOR_FONDO, COLOR_TEMA } from './config/marca.ts'
import configuracionDeAzure from './public/staticwebapp.config.json' with { type: 'json' }

// Manifiesto de la PWA (ADR-006): lo que el celular necesita para instalarla.
const manifiesto: Partial<ManifestOptions> = {
  id: '/',
  name: 'UCO Kudos',
  short_name: 'UCO Kudos',
  description: 'Plataforma institucional de reconocimientos de la UCO.',
  lang: 'es-CO',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  theme_color: COLOR_TEMA,
  background_color: COLOR_FONDO,
  categories: ['education', 'social'],
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El service worker nuevo reemplaza al anterior sin preguntar; la página lo usa en la siguiente carga.
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: manifiesto,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  // En desarrollo, /api va a la API de producción por este proxy: el navegador ve un solo origen, así que
  // no hace falta que la API acepte localhost en CORS. La URL es la de src/compartido/configuracion.ts.
  server: {
    proxy: {
      '/api': {
        target: 'https://ucokudos-api.grayriver-ab7e245b.canadacentral.azurecontainerapps.io',
        changeOrigin: true,
      },
    },
  },
  // La vista previa local usa las mismas cabeceras de seguridad que Azure Static Web Apps.
  preview: {
    headers: configuracionDeAzure.globalHeaders,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/pruebas/configuracion.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/pruebas/**', 'src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
      // El mismo mínimo que pide D-30 para el back.
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
})
