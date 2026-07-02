import { eq } from "drizzle-orm";

import { users } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { email, password } = await readCredentials(event);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, { user: { id: user.id, email: user.email } });

  return { id: user.id, email: user.email };
});
