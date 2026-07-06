import { asc, eq } from "drizzle-orm";

import { cards } from "../../../database/schema";

// Quote a CSV field only when it contains a delimiter, quote, or newline —
// plain words stay readable and re-importable as-is.
function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const setId = Number(getRouterParam(event, "id"));
  const set = await getOwnedSet(setId, user.id);

  const rows = await db
    .select({ term: cards.term, definition: cards.definition })
    .from(cards)
    .where(eq(cards.setId, setId))
    .orderBy(asc(cards.position), asc(cards.id));

  const csv = rows.map((row) => `${csvField(row.term)},${csvField(row.definition)}`).join("\n") + "\n";

  // ASCII-safe filename with an RFC 5987 UTF-8 variant for non-Latin titles.
  const ascii = set.title.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "-") || `set-${setId}`;
  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="${ascii}.csv"; filename*=UTF-8''${encodeURIComponent(set.title)}.csv`,
  );
  return csv;
});
