import { eq } from "drizzle-orm";

import { users } from "../../database/schema";
import type { PackLevel } from "../../utils/starterPacks";

export default defineEventHandler(async (event) => {
  const { email, password } = await readCredentials(event);
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters" });
  }

  const { level: rawLevel } = await readBody<{ level?: string | null }>(event);
  if (rawLevel != null && !PACK_LEVELS.includes(rawLevel as PackLevel)) {
    throw createError({ statusCode: 400, statusMessage: "Unknown level" });
  }
  const level = (rawLevel as PackLevel | null | undefined) ?? null;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email is already registered" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash, level }).returning();

  await setUserSession(event, { user: { id: user.id, email: user.email } });

  return { id: user.id, email: user.email };
});
