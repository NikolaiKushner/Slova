import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody<{ title?: string; description?: string }>(event);
  const title = body?.title?.trim();

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const [set] = await db
    .insert(sets)
    .values({ userId: user.id, title, description: body?.description?.trim() || null })
    .returning();

  return set;
});
