import { eq } from "drizzle-orm";

import { cards } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  await getOwnedCard(id, user.id);

  const { term, definition } = await readCardInput(event);

  const [updated] = await db.update(cards).set({ term, definition }).where(eq(cards.id, id)).returning();
  return updated;
});
