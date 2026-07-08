import { and, asc, eq, sql } from "drizzle-orm";

import { cardProgress, cards } from "../../database/schema";
import { NEW_CARDS_PER_DAY } from "../../utils/srs";

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

  // How many new cards this set already introduced today, against the daily
  // cap. Dates are UTC on both sides (sqlTimestamp and SQLite's date('now')).
  const [introduced] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cardProgress)
    .innerJoin(cards, eq(cards.id, cardProgress.cardId))
    .where(
      and(
        eq(cardProgress.userId, user.id),
        eq(cards.setId, id),
        sql`date(${cardProgress.introducedAt}) = date('now')`,
      ),
    );

  return {
    ...set,
    now: sqlTimestamp(),
    newCardsPerDay: NEW_CARDS_PER_DAY,
    newCardsRemainingToday: Math.max(0, NEW_CARDS_PER_DAY - (introduced?.count ?? 0)),
    cards: rows.map((row) => ({ ...row.card, progress: row.progress })),
  };
});
