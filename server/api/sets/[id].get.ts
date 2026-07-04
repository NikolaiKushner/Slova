import { and, asc, eq } from "drizzle-orm";

import { cardProgress, cards } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));

  const set = await getOwnedSet(id, user.id);
  const rows = await db
    .select({ card: cards, progress: cardProgress })
    .from(cards)
    .leftJoin(
      cardProgress,
      and(eq(cardProgress.cardId, cards.id), eq(cardProgress.userId, user.id)),
    )
    .where(eq(cards.setId, id))
    .orderBy(asc(cards.position));

  return { ...set, now: sqlTimestamp(), cards: rows.map((row) => ({ ...row.card, progress: row.progress })) };
});
