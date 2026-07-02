import { eq } from "drizzle-orm";

import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  await getOwnedSet(id, user.id);

  const { title, description } = await readSetInput(event);

  const [updated] = await db
    .update(sets)
    .set({ title, description })
    .where(eq(sets.id, id))
    .returning();

  return updated;
});
