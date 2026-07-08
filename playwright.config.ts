import { defineConfig } from "@playwright/test";

// E2E smoke tests run against the production build (npm run build first).
// The server gets its own throwaway SQLite database, migrated on boot.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    // Environments with a pre-provisioned Chromium (no `playwright install`)
    // can point at it explicitly.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "mkdir -p data && node .output/server/index.mjs",
    port: 3000,
    timeout: 60_000,
    reuseExistingServer: false,
    env: {
      NUXT_SESSION_PASSWORD: "e2e-only-session-password-32-chars!!",
      DATABASE_URL: "./data/e2e.db",
    },
  },
});
