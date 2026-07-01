import { eq } from "drizzle-orm";

import { cards } from "../../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const setId = Number(getRouterParam(event, "id"));
  await getOwnedSet(setId, user.id);

  const body = await readBody<{ term?: string; definition?: string }>(event);
  const term = body?.term?.trim();
  const definition = body?.definition?.trim();
  if (!term || !definition) {
    throw createError({ statusCode: 400, statusMessage: "Term and definition are required" });
  }

  const existing = await db.select().from(cards).where(eq(cards.setId, setId));
  const position = existing.length;

  const [card] = await db.insert(cards).values({ setId, term, definition, position }).returning();
  return card;
});
