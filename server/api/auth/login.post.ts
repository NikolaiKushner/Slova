import { eq } from "drizzle-orm";

import { users } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, { user: { id: user.id, email: user.email } });

  return { id: user.id, email: user.email };
});
