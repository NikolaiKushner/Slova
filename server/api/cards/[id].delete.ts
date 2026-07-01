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

  await db.delete(cards).where(eq(cards.id, id));
  return { success: true };
});
