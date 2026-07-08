import { eq } from "drizzle-orm";

import { cards } from "../../database/schema";

const MODES = ["topic", "text", "translate"] as const;
type Mode = (typeof MODES)[number];

const MAX_COUNT = 30;
const MAX_INPUT_CHARS = 20000;

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!aiEnabled()) {
    throw createError({
      statusCode: 503,
      statusMessage: "AI generation isn't configured on this server",
    });
  }
  const body = await readBody<{
    mode?: string;
    input?: string;
    count?: number;
    setId?: number;
  }>(event);

  const mode = body?.mode as Mode;
  if (!MODES.includes(mode)) {
    throw createError({ statusCode: 400, statusMessage: `mode must be one of: ${MODES.join(", ")}` });
  }
  const input = body?.input?.trim();
  if (!input) {
    throw createError({ statusCode: 400, statusMessage: "input is required" });
  }
  if (input.length > MAX_INPUT_CHARS) {
    throw createError({ statusCode: 400, statusMessage: `input is too long (max ${MAX_INPUT_CHARS} characters)` });
  }

  // Each call costs real money — keep a per-IP lid on it. Translations are
  // tiny (and served from cache when repeated), so they get a looser bucket
  // than full set generation.
  if (mode === "translate") {
    if (input.length > 100) {
      throw createError({ statusCode: 400, statusMessage: "A term should be under 100 characters" });
    }
    enforceRateLimit(event, "ai-translate", { limit: 120, windowSeconds: 60 * 60 });
  } else {
    enforceRateLimit(event, "ai-generate", { limit: 20, windowSeconds: 60 * 60 });
  }
  const count = Math.min(Math.max(Number(body?.count) || 12, 1), MAX_COUNT);

  // Optionally avoid duplicating cards the target set already has.
  let existingTerms: string[] | undefined;
  if (body?.setId) {
    const set = await getOwnedSet(Number(body.setId), user.id);
    const rows = await db.select({ term: cards.term }).from(cards).where(eq(cards.setId, set.id));
    existingTerms = rows.map((row) => row.term);
  }

  const generated = await generateCards({ mode, input, count, existingTerms });
  return { cards: generated };
});
