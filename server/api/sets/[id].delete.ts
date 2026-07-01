import { eq } from "drizzle-orm";

import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  await getOwnedSet(id, user.id);

  await db.delete(sets).where(eq(sets.id, id));
  return { success: true };
});
