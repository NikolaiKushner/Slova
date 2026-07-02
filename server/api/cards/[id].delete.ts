import { eq } from "drizzle-orm";

import { cards } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  await getOwnedCard(id, user.id);

  await db.delete(cards).where(eq(cards.id, id));
  return { success: true };
});
