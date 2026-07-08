import { cp } from "node:fs/promises";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Slova',
      meta: [
        {
          name: 'description',
          content:
            'Flashcards with spaced repetition: study a few minutes a day and Slova brings every word back right before you would forget it. Free and open source.',
        },
        // Social cards. og:image must be an absolute URL.
        { property: 'og:site_name', content: 'Slova' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Slova — learn words that stick' },
        {
          property: 'og:description',
          content:
            'Flashcards with spaced repetition: study a few minutes a day and every word comes back right before you would forget it.',
        },
        { property: 'og:image', content: 'https://slova.fly.dev/og.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Slova — learn words that stick' },
        { name: 'twitter:image', content: 'https://slova.fly.dev/og.png' },
        { name: 'theme-color', content: '#2563eb' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Slova' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    hooks: {
      // The migrate plugin reads migration files from disk at runtime, and
      // only .output is shipped to production, so bundle them into it.
      async compiled(nitro) {
        await cp(
          join(nitro.options.rootDir, "server/database/migrations"),
          join(nitro.options.output.serverDir, "database/migrations"),
          { recursive: true },
        );
      },
    },
  },
})
