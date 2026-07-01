import { eq } from "drizzle-orm";

import { cards } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));

  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  if (!card) {
    throw createError({ statusCode: 404, statusMessage: "Card not found" });
  }
  await getOwnedSet(card.setId, user.id);

  const body = await readBody<{ term?: string; definition?: string }>(event);
  const term = body?.term?.trim();
  const definition = body?.definition?.trim();
  if (!term || !definition) {
    throw createError({ statusCode: 400, statusMessage: "Term and definition are required" });
  }

  const [updated] = await db.update(cards).set({ term, definition }).where(eq(cards.id, id)).returning();
  return updated;
});
