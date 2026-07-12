// Predefined accounts for local development and staging testing. Seeded by
// server/plugins/seed.ts (dev server always; production builds only when
// SLOVA_SEED_USERS=1). Credentials are documented in TEST_USERS.md.
//
// Explicit imports only (no Nitro auto-imports) so tests/unit can import
// this module directly.

import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "../database/schema";
import { sqlTimestamp } from "./srs";
import { STARTER_PACKS } from "./starterPacks";

type Db = BetterSQLite3Database<typeof schema>;

export interface SeedUser {
  email: string;
  password: string;
  role: "user" | "admin";
  level: string | null;
  note: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    email: "admin@slova.local",
    password: "superadmin123",
    role: "admin",
    level: null,
    note: "superadmin (role=admin in the session)",
  },
  {
    email: "test@slova.local",
    password: "testuser123",
    role: "user",
    level: "A1",
    note: "pre-filled: 3 sets, cards due now, learned cards, review history",
  },
  {
    email: "fresh@slova.local",
    password: "freshuser123",
    role: "user",
    level: null,
    note: "empty account for onboarding / first-run flows",
  },
];

const days = (n: number) => sqlTimestamp(new Date(Date.now() + n * 24 * 60 * 60 * 1000));

// Creates any SEED_USERS missing from the db. Existing accounts are left
// untouched, so this is safe to run on every server start.
export async function seedPredefinedUsers(
  db: Db,
  hash: (password: string) => Promise<string>,
): Promise<string[]> {
  const created: string[] = [];

  for (const seed of SEED_USERS) {
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, seed.email));
    if (existing) continue;

    const [user] = await db
      .insert(schema.users)
      .values({
        email: seed.email,
        passwordHash: await hash(seed.password),
        role: seed.role,
        level: seed.level,
      })
      .returning();

    if (seed.email === "test@slova.local") await seedTestUserData(db, user.id);
    created.push(seed.email);
  }

  return created;
}

// Gives the test user a realistic account: three starter-pack sets where one
// is mid-study (learned cards, cards due right now, untouched cards) and a
// review history spread over the past two weeks for streak/heatmap/stats.
async function seedTestUserData(db: Db, userId: number) {
  const packs = STARTER_PACKS.filter((p) =>
    ["top-verbs", "essential-nouns", "everyday-phrases"].includes(p.slug),
  );

  const setCards: (typeof schema.cards.$inferSelect)[][] = [];
  for (const pack of packs) {
    const [set] = await db
      .insert(schema.sets)
      .values({ userId, title: pack.title, description: pack.description })
      .returning();
    const inserted = await db
      .insert(schema.cards)
      .values(pack.cards.map((c, i) => ({ setId: set.id, ...c, position: i })))
      .returning();
    setCards.push(inserted);
  }

  // First set (Top English Verbs, 30 cards): 8 learned, 12 due now, 10 new.
  const [verbs, nouns] = setCards;
  const progress: (typeof schema.cardProgress.$inferInsert)[] = [];
  const log: (typeof schema.reviewLog.$inferInsert)[] = [];

  verbs.slice(0, 8).forEach((card, i) => {
    progress.push({
      userId,
      cardId: card.id,
      status: "learned",
      ease: 2.6,
      intervalDays: 30,
      dueAt: days(10 + i * 3),
      correctStreak: 5,
      lapses: 0,
      lastReviewedAt: days(-(5 + i)),
      introducedAt: days(-40),
    });
    // Each learned card was answered a few times on its way up.
    for (const daysAgo of [14, 8, 5]) {
      log.push({ userId, cardId: card.id, rating: "good", mode: "flashcards", reviewedAt: days(-daysAgo) });
    }
  });

  verbs.slice(8, 20).forEach((card, i) => {
    progress.push({
      userId,
      cardId: card.id,
      status: "learning",
      ease: i % 3 === 0 ? 2.3 : 2.5,
      intervalDays: 1,
      dueAt: days(-(i % 3)), // due today or slightly overdue
      correctStreak: 1,
      lapses: i % 3 === 0 ? 1 : 0,
      lastReviewedAt: days(-1 - (i % 3)),
      introducedAt: days(-10),
    });
    log.push({
      userId,
      cardId: card.id,
      rating: i % 3 === 0 ? "again" : "good",
      mode: i % 2 === 0 ? "flashcards" : "choice",
      reviewedAt: days(-(1 + (i % 4))),
    });
  });
  // verbs[20..29] stay new: no progress rows.

  // Second set: 5 cards just introduced and due now, the rest new.
  nouns.slice(0, 5).forEach((card, i) => {
    progress.push({
      userId,
      cardId: card.id,
      status: "learning",
      ease: 2.5,
      intervalDays: 0.5,
      dueAt: days(-1),
      correctStreak: 1,
      lapses: 0,
      lastReviewedAt: days(-1),
      introducedAt: days(-1),
    });
    log.push({ userId, cardId: card.id, rating: "hard", mode: "typing", reviewedAt: days(-1) });
  });
  // Third set stays completely new.

  // A review today keeps the streak alive on login.
  log.push({ userId, cardId: verbs[8].id, rating: "good", mode: "flashcards", reviewedAt: days(0) });

  await db.insert(schema.cardProgress).values(progress);
  await db.insert(schema.reviewLog).values(log);
}
