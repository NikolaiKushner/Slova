import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // CEFR level picked at registration (A1 | A2 | B1); null when skipped.
  level: text("level"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const sets = sqliteTable(
  "sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index("sets_user_id_idx").on(table.userId)],
);

export const cards = sqliteTable(
  "cards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    setId: integer("set_id")
      .notNull()
      .references(() => sets.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    definition: text("definition").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("cards_set_id_position_idx").on(table.setId, table.position)],
);

// Per-user spaced-repetition state for a card (SM-2-style scheduling).
// A card with no row here is "new" — it has never been reviewed.
export const cardProgress = sqliteTable(
  "card_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("learning"), // learning | learned
    ease: real("ease").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    dueAt: text("due_at").notNull(),
    correctStreak: integer("correct_streak").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    lastReviewedAt: text("last_reviewed_at").notNull(),
  },
  (table) => [
    uniqueIndex("card_progress_user_card_idx").on(table.userId, table.cardId),
    index("card_progress_user_due_idx").on(table.userId, table.dueAt),
  ],
);

// One row per answer, across all study modes. Powers streaks and stats.
export const reviewLog = sqliteTable(
  "review_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    rating: text("rating").notNull(), // again | hard | good
    mode: text("mode").notNull().default("flashcards"), // flashcards | choice | typing
    reviewedAt: text("reviewed_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index("review_log_user_reviewed_idx").on(table.userId, table.reviewedAt)],
);
