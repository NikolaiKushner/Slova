import { eq } from "drizzle-orm";

import { users } from "../../database/schema";

export default defineEventHandler(async (event) => {
  // Keep bots from mass-creating accounts: 10 sign-ups per hour per IP.
  enforceRateLimit(event, "register", { limit: 10, windowSeconds: 60 * 60 });

  const { email, password } = await readCredentials(event);
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters" });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email is already registered" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  await setUserSession(event, { user: { id: user.id, email: user.email } });

  return { id: user.id, email: user.email };
});
