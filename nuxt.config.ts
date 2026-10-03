// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/supabase', '@nuxtjs/leaflet', '@nuxt/fonts', '@vite-pwa/nuxt'],
  css: ['~/assets/css/penpal.css', '~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pl' },
      title: 'PiszuPiszu',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F6F0E4' },
        { name: 'description', content: 'Łączymy pokolenia, list po liście.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
      ],
    },
  },
  // All data goes through server/api; the client only uses Supabase auth. Our own middleware handles redirects.
  supabase: {
    redirect: false,
    types: '~~/types/database.ts',
  },
  // Secure cookies are dropped over plain http, so phones on the LAN couldn't keep a session in dev.
  // Production is served over https and keeps the module default (secure: true).
  $development: {
    supabase: { cookieOptions: { maxAge: 60 * 60 * 8, sameSite: 'lax', secure: false } },
  },
  runtimeConfig: { adminCode: '' },
  fonts: {
    families: [
      { name: 'Fraunces', weights: [600, 700], provider: 'google' },
      { name: 'Atkinson Hyperlegible', weights: [400, 700], provider: 'google' },
      { name: 'Caveat', weights: [400, 600], provider: 'google' },
    ],
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'PiszuPiszu',
      short_name: 'PiszuPiszu',
      description: 'Łączymy pokolenia, list po liście.',
      lang: 'pl',
      start_url: '/',
      display: 'standalone',
      theme_color: '#F6F0E4',
      background_color: '#F6F0E4',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    // SSR app: no SPA fallback, only precache static assets.
    workbox: { navigateFallback: null, globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'] },
    devOptions: { enabled: false },
  },
})
