import { and, desc, eq, sql } from "drizzle-orm";

import { cardProgress, cards, sets } from "../../database/schema";
import { NEW_CARDS_PER_DAY } from "../../utils/srs";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const now = sqlTimestamp();

  // A card is due when its next review time has passed. Never-reviewed cards
  // are due too, but only up to the daily new-card cap per set — counted
  // against how many new cards that set already introduced today.
  const rows = await db
    .select({
      set: sets,
      cardCount: sql<number>`count(${cards.id})`,
      learnedCount: sql<number>`count(case when ${cardProgress.status} = 'learned' then 1 end)`,
      dueReviewCount: sql<number>`count(case when ${cardProgress.id} is not null and ${cardProgress.dueAt} <= ${now} then 1 end)`,
      newCount: sql<number>`count(case when ${cards.id} is not null and ${cardProgress.id} is null then 1 end)`,
      introducedToday: sql<number>`count(case when date(${cardProgress.introducedAt}) = date('now') then 1 end)`,
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
    dueCount:
      row.dueReviewCount +
      Math.min(row.newCount, Math.max(0, NEW_CARDS_PER_DAY - row.introducedToday)),
  }));
});
