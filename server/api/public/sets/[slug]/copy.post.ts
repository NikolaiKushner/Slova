import { and, asc, eq } from "drizzle-orm";

import { cards, sets } from "../../../../database/schema";

// Copy a shared set into the logged-in user's account: a fresh set with the
// same cards and no study progress.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const slug = getRouterParam(event, "slug")!;

  const [source] = await db
    .select()
    .from(sets)
    .where(and(eq(sets.shareSlug, slug), eq(sets.isPublic, 1)));
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: "This set isn't shared (anymore)" });
  }

  const sourceCards = await db
    .select()
    .from(cards)
    .where(eq(cards.setId, source.id))
    .orderBy(asc(cards.position));

  const [copy] = await db
    .insert(sets)
    .values({ userId: user.id, title: source.title, description: source.description })
    .returning();
  if (sourceCards.length) {
    await db.insert(cards).values(
      sourceCards.map((card, i) => ({
        setId: copy!.id,
        term: card.term,
        definition: card.definition,
        position: i,
      })),
    );
  }

  return { id: copy!.id, cardCount: sourceCards.length };
});
