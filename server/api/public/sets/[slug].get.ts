import { and, asc, eq } from "drizzle-orm";

import { cards, sets } from "../../../database/schema";

// Read-only view of a shared set. No auth — anyone with the link can see the
// cards, but never the owner's identity or progress.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")!;

  const [set] = await db
    .select()
    .from(sets)
    .where(and(eq(sets.shareSlug, slug), eq(sets.isPublic, 1)));
  if (!set) {
    throw createError({ statusCode: 404, statusMessage: "This set isn't shared (anymore)" });
  }

  const rows = await db
    .select({ id: cards.id, term: cards.term, definition: cards.definition })
    .from(cards)
    .where(eq(cards.setId, set.id))
    .orderBy(asc(cards.position));

  return { title: set.title, description: set.description, cards: rows };
});
