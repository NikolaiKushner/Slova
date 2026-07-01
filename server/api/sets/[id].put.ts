import { eq } from "drizzle-orm";

import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  await getOwnedSet(id, user.id);

  const body = await readBody<{ title?: string; description?: string }>(event);
  const title = body?.title?.trim();
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const [updated] = await db
    .update(sets)
    .set({ title, description: body?.description?.trim() || null })
    .where(eq(sets.id, id))
    .returning();

  return updated;
});
