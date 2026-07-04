import { and, eq } from "drizzle-orm";

import { cards, sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const slug = getRouterParam(event, "slug");

  const pack = STARTER_PACKS.find((candidate) => candidate.slug === slug);
  if (!pack) {
    throw createError({ statusCode: 404, statusMessage: "Starter pack not found" });
  }

  const [existing] = await db
    .select({ id: sets.id })
    .from(sets)
    .where(and(eq(sets.userId, user.id), eq(sets.title, pack.title)));
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "You already have this pack" });
  }

  const [set] = await db
    .insert(sets)
    .values({ userId: user.id, title: pack.title, description: pack.description })
    .returning();

  await db
    .insert(cards)
    .values(pack.cards.map((card, position) => ({ setId: set!.id, ...card, position })));

  return set;
});
