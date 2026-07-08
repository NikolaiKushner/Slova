import { and, desc, eq } from "drizzle-orm";

import { cardProgress, reviewLog } from "../../../../database/schema";

// Undo the card's most recent review: restore the scheduling state that was
// snapshotted into the log row, then drop the row itself. A card that was new
// before the review goes back to having no progress at all.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  const card = await getOwnedCard(id, user.id);

  const [lastReview] = await db
    .select()
    .from(reviewLog)
    .where(and(eq(reviewLog.userId, user.id), eq(reviewLog.cardId, card.id)))
    .orderBy(desc(reviewLog.id))
    .limit(1);
  if (!lastReview) {
    throw createError({ statusCode: 404, statusMessage: "Nothing to undo" });
  }

  let progress = null;
  if (lastReview.prevState) {
    const prev = JSON.parse(lastReview.prevState);
    [progress] = await db
      .update(cardProgress)
      .set(prev)
      .where(and(eq(cardProgress.userId, user.id), eq(cardProgress.cardId, card.id)))
      .returning();
  } else {
    await db
      .delete(cardProgress)
      .where(and(eq(cardProgress.userId, user.id), eq(cardProgress.cardId, card.id)));
  }

  await db.delete(reviewLog).where(eq(reviewLog.id, lastReview.id));

  return { progress };
});
