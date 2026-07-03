import { and, desc, eq, sql } from "drizzle-orm";

import { cardProgress, cards, sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const now = sqlTimestamp();

  // A card counts as due when it was never reviewed (no progress row) or its
  // next review time has passed.
  const rows = await db
    .select({
      set: sets,
      cardCount: sql<number>`count(${cards.id})`,
      learnedCount: sql<number>`count(case when ${cardProgress.status} = 'learned' then 1 end)`,
      dueCount: sql<number>`count(case when ${cards.id} is not null and (${cardProgress.id} is null or ${cardProgress.dueAt} <= ${now}) then 1 end)`,
    })
    .from(sets)
    .leftJoin(cards, eq(cards.setId, sets.id))
    .leftJoin(
      cardProgress,
      and(eq(cardProgress.cardId, cards.id), eq(cardProgress.userId, user.id)),
    )
    .where(eq(sets.userId, user.id))
    .groupBy(sets.id)
    .orderBy(desc(sets.createdAt));

  return rows.map((row) => ({
    ...row.set,
    cardCount: row.cardCount,
    learnedCount: row.learnedCount,
    dueCount: row.dueCount,
  }));
});
