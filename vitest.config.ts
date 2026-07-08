import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only — tests/e2e/*.spec.ts belong to Playwright.
    include: ["tests/unit/**/*.test.ts"],
  },
});
