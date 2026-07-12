import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeAll, describe, expect, it } from "vitest";

import * as schema from "../../server/database/schema";
import { sqlTimestamp } from "../../server/utils/srs";
import { SEED_USERS, seedPredefinedUsers } from "../../server/utils/seedUsers";

const fakeHash = async (password: string) => `hashed:${password}`;

function freshDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./server/database/migrations" });
  return db;
}

describe("seedPredefinedUsers", () => {
  let db: ReturnType<typeof freshDb>;

  beforeAll(async () => {
    db = freshDb();
    await seedPredefinedUsers(db, fakeHash);
  });

  it("creates the three predefined accounts with hashed passwords", async () => {
    const rows = await db.select().from(schema.users);
    expect(rows.map((u) => u.email).sort()).toEqual(SEED_USERS.map((u) => u.email).sort());
    for (const row of rows) {
      const seed = SEED_USERS.find((u) => u.email === row.email)!;
      expect(row.passwordHash).toBe(`hashed:${seed.password}`);
      expect(row.role).toBe(seed.role);
    }
  });

  it("makes exactly one admin", async () => {
    const admins = await db.select().from(schema.users).where(eq(schema.users.role, "admin"));
    expect(admins.map((u) => u.email)).toEqual(["admin@slova.local"]);
  });

  it("pre-fills the test user with sets, due cards, learned cards and history", async () => {
    const [testUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "test@slova.local"));

    const sets = await db.select().from(schema.sets).where(eq(schema.sets.userId, testUser.id));
    expect(sets).toHaveLength(3);

    const progress = await db
      .select()
      .from(schema.cardProgress)
      .where(eq(schema.cardProgress.userId, testUser.id));
    const now = sqlTimestamp();
    expect(progress.some((p) => p.status === "learned")).toBe(true);
    expect(progress.some((p) => p.status === "learning" && p.dueAt <= now)).toBe(true);

    const log = await db
      .select()
      .from(schema.reviewLog)
      .where(eq(schema.reviewLog.userId, testUser.id));
    expect(log.length).toBeGreaterThan(10);
    // History spans multiple days so streak/heatmap have something to show.
    expect(new Set(log.map((l) => l.reviewedAt.slice(0, 10))).size).toBeGreaterThan(3);
  });

  it("leaves the fresh user completely empty", async () => {
    const [fresh] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "fresh@slova.local"));
    const sets = await db.select().from(schema.sets).where(eq(schema.sets.userId, fresh.id));
    expect(sets).toHaveLength(0);
  });

  it("is idempotent: a second run creates nothing and touches nothing", async () => {
    const before = {
      users: (await db.select().from(schema.users)).length,
      cards: (await db.select().from(schema.cards)).length,
      log: (await db.select().from(schema.reviewLog)).length,
    };
    const created = await seedPredefinedUsers(db, fakeHash);
    expect(created).toEqual([]);
    expect((await db.select().from(schema.users)).length).toBe(before.users);
    expect((await db.select().from(schema.cards)).length).toBe(before.cards);
    expect((await db.select().from(schema.reviewLog)).length).toBe(before.log);
  });
});
