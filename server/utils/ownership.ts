import { eq } from "drizzle-orm";

import { cards, sets } from "../database/schema";

export async function getOwnedSet(setId: number, userId: number) {
  const [set] = await db.select().from(sets).where(eq(sets.id, setId));
  if (!set || set.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: "Set not found" });
  }
  return set;
}

export async function getOwnedCard(cardId: number, userId: number) {
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (!card) {
    throw createError({ statusCode: 404, statusMessage: "Card not found" });
  }
  await getOwnedSet(card.setId, userId);
  return card;
}
