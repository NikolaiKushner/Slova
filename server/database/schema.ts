import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
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
