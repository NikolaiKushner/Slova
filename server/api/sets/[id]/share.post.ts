import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { sets } from "../../../database/schema";

// Toggle public sharing for a set. Enabling mints a share slug on first use;
// disabling keeps the slug so sharing again restores the same link.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const id = Number(getRouterParam(event, "id"));
  const set = await getOwnedSet(id, user.id);

  const body = await readBody<{ enabled?: boolean }>(event);
  if (typeof body?.enabled !== "boolean") {
    throw createError({ statusCode: 400, statusMessage: "enabled must be a boolean" });
  }

  const shareSlug = set.shareSlug ?? randomBytes(6).toString("base64url");
  const [updated] = await db
    .update(sets)
    .set({ isPublic: body.enabled ? 1 : 0, shareSlug })
    .where(eq(sets.id, set.id))
    .returning();

  return { isPublic: updated!.isPublic, shareSlug: updated!.shareSlug };
});
