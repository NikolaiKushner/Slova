import { eq, max } from "drizzle-orm";

import { cards } from "../../../../database/schema";

const MAX_IMPORT = 500;

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const setId = Number(getRouterParam(event, "id"));
  await getOwnedSet(setId, user.id);

  const body = await readBody<{ cards?: { term?: string; definition?: string }[] }>(event);
  if (!Array.isArray(body?.cards) || !body.cards.length) {
    throw createError({ statusCode: 400, statusMessage: "cards must be a non-empty array" });
  }
  if (body.cards.length > MAX_IMPORT) {
    throw createError({ statusCode: 400, statusMessage: `At most ${MAX_IMPORT} cards per import` });
  }

  const rows = body.cards
    .map((card) => ({ term: card?.term?.trim() ?? "", definition: card?.definition?.trim() ?? "" }))
    .filter((card) => card.term && card.definition);
  if (!rows.length) {
    throw createError({ statusCode: 400, statusMessage: "No valid cards to import" });
  }

  const [row] = await db.select({ maxPosition: max(cards.position) }).from(cards).where(eq(cards.setId, setId));
  let position = (row?.maxPosition ?? -1) + 1;

  const inserted = await db
    .insert(cards)
    .values(rows.map((card) => ({ setId, ...card, position: position++ })))
    .returning();
  return { imported: inserted.length, skipped: body.cards.length - rows.length };
});
