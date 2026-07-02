import { existsSync } from "node:fs";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { db } from "../utils/db";

// In dev the migrations live in the source tree; in production the build
// copies them into .output/server (see the nitro `compiled` hook in
// nuxt.config.ts).
const candidates = [
  "./server/database/migrations",
  "./.output/server/database/migrations",
];

export default defineNitroPlugin(() => {
  const migrationsFolder = candidates.find((path) => existsSync(path));
  if (!migrationsFolder) {
    throw new Error(
      `Migrations folder not found (looked in: ${candidates.join(", ")})`,
    );
  }
  migrate(db, { migrationsFolder });
});
