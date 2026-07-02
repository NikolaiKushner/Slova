import { eq, max } from "drizzle-orm";

import { cards } from "../../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const setId = Number(getRouterParam(event, "id"));
  await getOwnedSet(setId, user.id);

  const { term, definition } = await readCardInput(event);

  // max(position) + 1 rather than row count: counts reuse positions of
  // deleted cards, breaking the study-mode ordering.
  const [row] = await db.select({ maxPosition: max(cards.position) }).from(cards).where(eq(cards.setId, setId));
  const position = (row?.maxPosition ?? -1) + 1;

  const [card] = await db.insert(cards).values({ setId, term, definition, position }).returning();
  return card;
});
