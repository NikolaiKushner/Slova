import { and, eq } from "drizzle-orm";

import { cardProgress, reviewLog } from "../../../database/schema";
import {
  applyRating,
  NEW_CARD_STATE,
  RATINGS,
  STUDY_MODES,
  sqlTimestamp,
  type Rating,
  type StudyMode,
} from "../../../utils/srs";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  const card = await getOwnedCard(id, user.id);

  const body = await readBody<{ rating?: string; mode?: string }>(event);
  const rating = body?.rating;
  if (!rating || !(RATINGS as readonly string[]).includes(rating)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Rating must be one of: ${RATINGS.join(", ")}`,
    });
  }
  const mode: StudyMode =
    body?.mode && (STUDY_MODES as readonly string[]).includes(body.mode)
      ? (body.mode as StudyMode)
      : "flashcards";

  const [existing] = await db
    .select()
    .from(cardProgress)
    .where(and(eq(cardProgress.userId, user.id), eq(cardProgress.cardId, card.id)));

  const next = applyRating(existing ?? NEW_CARD_STATE, rating as Rating);
  const now = sqlTimestamp();

  // Snapshot the pre-review scheduling state so this answer can be undone.
  const prevState = existing
    ? JSON.stringify({
        status: existing.status,
        ease: existing.ease,
        intervalDays: existing.intervalDays,
        dueAt: existing.dueAt,
        correctStreak: existing.correctStreak,
        lapses: existing.lapses,
        lastReviewedAt: existing.lastReviewedAt,
      })
    : null;

  let progress;
  if (existing) {
    [progress] = await db
      .update(cardProgress)
      .set({ ...next, lastReviewedAt: now })
      .where(eq(cardProgress.id, existing.id))
      .returning();
  } else {
    [progress] = await db
      .insert(cardProgress)
      .values({ userId: user.id, cardId: card.id, ...next, lastReviewedAt: now, introducedAt: now })
      .returning();
  }

  await db
    .insert(reviewLog)
    .values({ userId: user.id, cardId: card.id, rating, mode, prevState, reviewedAt: now });

  return progress;
});
