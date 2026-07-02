import { desc, eq } from "drizzle-orm";

import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  return db.select().from(sets).where(eq(sets.userId, user.id)).orderBy(desc(sets.createdAt));
});
