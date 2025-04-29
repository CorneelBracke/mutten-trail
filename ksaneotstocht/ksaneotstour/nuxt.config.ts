// nuxt.config.ts
import { presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@unocss/nuxt' // Zorg dat dit actief is, en @nuxtjs/tailwindcss weg is
  ],

  // GEEN css: [...] array hier (UnoCSS regelt dit)

  runtimeConfig: {
    // PRIVATE keys (alleen server-side beschikbaar)
    // Zorg dat deze overeenkomen met je .env / Vercel variabelen!
    supabaseKey: process.env.SUPABASE_KEY,
    adminSecret: process.env.ADMIN_SECRET,
    sessionPassword: process.env.NUXT_SESSION_PASSWORD, // MOET min. 32 random karakters zijn!

    // PUBLIC keys (ook client-side beschikbaar)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
    }
  },

  app: {
    head: {
      link: [ // Importeert "Inter" font
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }
      ]
    }
  },

  unocss: {
    presets: [
      presetUno(),
      presetAttributify(),
      presetIcons({
        scale: 1.2, warn: true,
        extraProperties: { 'display': 'inline-block', 'vertical-align': 'middle' },
      }),
    ],
    theme: {
      colors: {
        'brand-yellow': '#fad30f',
      },
      fontFamily: { // Stelt "Inter" in als standaard sans-serif font
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      }
    },
  },
})