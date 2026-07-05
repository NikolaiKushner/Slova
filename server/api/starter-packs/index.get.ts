import { eq } from "drizzle-orm";

import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  // A pack counts as added if the user already has a set with its title;
  // sets don't track their origin, and a title match is enough to stop
  // re-suggesting a pack the user just took.
  const owned = await db.select({ title: sets.title }).from(sets).where(eq(sets.userId, user.id));
  const ownedTitles = new Set(owned.map((set) => set.title));

  return STARTER_PACKS.map((pack) => ({
    slug: pack.slug,
    title: pack.title,
    description: pack.description,
    level: pack.level,
    cardCount: pack.cards.length,
    added: ownedTitles.has(pack.title),
  }));
});
