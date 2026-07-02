import { cp } from "node:fs/promises";
import { join } from "node:path";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
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
