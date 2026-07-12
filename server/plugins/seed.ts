import { db } from "../utils/db";
import { SEED_BANNER, seedPredefinedUsers } from "../utils/seedUsers";

// Seeds the predefined test accounts (see TEST_USERS.md) and prints their
// credentials. Runs after migrate.ts (nitro loads plugins alphabetically).
//
// Enabled in `nuxt dev` always; in production builds only when
// SLOVA_SEED_USERS=1 is set (docker-compose sets it, Fly.io must not).
export default defineNitroPlugin(async () => {
  if (!import.meta.dev && process.env.SLOVA_SEED_USERS !== "1") return;

  const created = await seedPredefinedUsers(db, hashPassword);

  const status = created.length
    ? `  (created this start: ${created.join(", ")})`
    : "  (all accounts already existed — data untouched)";
  console.log(`${SEED_BANNER}\n${status}\n`);
});
