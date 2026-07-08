import { and, desc, eq, sql } from "drizzle-orm";

import { cardProgress, cards, reviewLog, sets } from "../database/schema";
import { NEW_CARDS_PER_DAY } from "../utils/srs";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const now = sqlTimestamp();
  const today = now.slice(0, 10);

  const day = sql<string>`date(${reviewLog.reviewedAt})`;
  const dayRows = await db
    .select({ day, count: sql<number>`count(*)` })
    .from(reviewLog)
    .where(eq(reviewLog.userId, user.id))
    .groupBy(day)
    .orderBy(desc(day))
    .limit(366);

  // Consecutive study days counting back from today; a streak survives until
  // the end of the day after the last study day (studying yesterday keeps it).
  let streak = 0;
  let cursor = new Date(`${today}T00:00:00Z`);
  if (dayRows.length && dayRows[0]!.day !== today) {
    cursor = new Date(cursor.getTime() - 86400000);
  }
  for (const row of dayRows) {
    if (row.day !== cursor.toISOString().slice(0, 10)) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }

  const [reviewsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewLog)
    .where(and(eq(reviewLog.userId, user.id), sql`date(${reviewLog.reviewedAt}) = ${today}`));

  // Due total mirrors the per-set list: overdue reviews plus new cards,
  // the latter capped by each set's remaining daily allowance.
  const dueRows = await db
    .select({
      dueReviewCount: sql<number>`count(case when ${cardProgress.id} is not null and ${cardProgress.dueAt} <= ${now} then 1 end)`,
      newCount: sql<number>`count(case when ${cardProgress.id} is null then 1 end)`,
      introducedToday: sql<number>`count(case when date(${cardProgress.introducedAt}) = date('now') then 1 end)`,
    })
    .from(cards)
    .innerJoin(sets, eq(cards.setId, sets.id))
    .leftJoin(
      cardProgress,
      and(eq(cardProgress.cardId, cards.id), eq(cardProgress.userId, user.id)),
    )
    .where(eq(sets.userId, user.id))
    .groupBy(sets.id);

  const dueTotal = dueRows.reduce(
    (total, row) =>
      total +
      row.dueReviewCount +
      Math.min(row.newCount, Math.max(0, NEW_CARDS_PER_DAY - row.introducedToday)),
    0,
  );

  // Daily review counts for the trailing two weeks, zero-filled so the
  // chart always shows a continuous timeline.
  const CHART_DAYS = 14;
  const countByDay = new Map(dayRows.map((row) => [row.day, row.count]));
  const todayStart = new Date(`${today}T00:00:00Z`).getTime();
  const days = Array.from({ length: CHART_DAYS }, (_, i) => {
    const dayIso = new Date(todayStart - (CHART_DAYS - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { day: dayIso, reviews: countByDay.get(dayIso) ?? 0 };
  });

  // Half a year of daily counts for the activity heatmap, zero-filled.
  const HEATMAP_DAYS = 182;
  const heatmap = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const dayIso = new Date(todayStart - (HEATMAP_DAYS - 1 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    return { day: dayIso, reviews: countByDay.get(dayIso) ?? 0 };
  });

  // Scheduled reviews for the next two weeks; anything already overdue is
  // clamped into today's bucket. New (never-reviewed) cards aren't included —
  // they trickle in via the daily new-card allowance instead.
  const forecastDay = sql<string>`max(date(${cardProgress.dueAt}), ${today})`;
  const forecastRows = await db
    .select({ day: forecastDay, count: sql<number>`count(*)` })
    .from(cardProgress)
    .where(eq(cardProgress.userId, user.id))
    .groupBy(forecastDay);
  const forecastMap = new Map(forecastRows.map((row) => [row.day, row.count]));
  const forecast = Array.from({ length: CHART_DAYS }, (_, i) => {
    const dayIso = new Date(todayStart + i * 86400000).toISOString().slice(0, 10);
    return { day: dayIso, reviews: forecastMap.get(dayIso) ?? 0 };
  });

  return {
    streak,
    reviewsToday: reviewsRow?.count ?? 0,
    dueTotal,
    days,
    heatmap,
    forecast,
  };
});
