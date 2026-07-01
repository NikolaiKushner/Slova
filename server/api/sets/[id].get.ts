import { asc, eq } from "drizzle-orm";

import { cards } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));

  const set = await getOwnedSet(id, user.id);
  const setCards = await db.select().from(cards).where(eq(cards.setId, id)).orderBy(asc(cards.position));

  return { ...set, cards: setCards };
});
