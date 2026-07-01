import { eq } from "drizzle-orm";

import { sets } from "../database/schema";

export async function getOwnedSet(setId: number, userId: number) {
  const [set] = await db.select().from(sets).where(eq(sets.id, setId));
  if (!set || set.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: "Set not found" });
  }
  return set;
}
