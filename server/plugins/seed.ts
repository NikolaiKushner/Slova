import { db } from "../utils/db";
import { SEED_USERS, seedPredefinedUsers } from "../utils/seedUsers";

// Seeds the predefined test accounts (see TEST_USERS.md) and prints their
// credentials. Runs after migrate.ts (nitro loads plugins alphabetically).
//
// Enabled in `nuxt dev` always; in production builds only when
// SLOVA_SEED_USERS=1 is set (docker-compose sets it, Fly.io must not).
export default defineNitroPlugin(async () => {
  if (!import.meta.dev && process.env.SLOVA_SEED_USERS !== "1") return;

  const created = await seedPredefinedUsers(db, hashPassword);

  const rows = SEED_USERS.map(
    (u) => `  ${u.email.padEnd(22)} ${u.password.padEnd(16)} ${u.note}`,
  );
  console.log(
    [
      "",
      "──────────────────────── test accounts ────────────────────────",
      ...rows,
      created.length
        ? `  (created this start: ${created.join(", ")})`
        : "  (all accounts already existed — data untouched)",
      "  Details: TEST_USERS.md. Never set SLOVA_SEED_USERS=1 in prod.",
      "────────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
});
