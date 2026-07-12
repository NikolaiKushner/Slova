import { eq } from "drizzle-orm";

import { users } from "../../database/schema";

export default defineEventHandler(async (event) => {
  // Slow down credential-stuffing: 10 attempts per 15 minutes per IP.
  enforceRateLimit(event, "login", { limit: 10, windowSeconds: 15 * 60 });

  const { email, password } = await readCredentials(event);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, { user: { id: user.id, email: user.email, role: user.role } });

  return { id: user.id, email: user.email };
});
