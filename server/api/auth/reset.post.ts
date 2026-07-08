import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { passwordResetTokens, users } from "../../database/schema";

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, "reset", { limit: 10, windowSeconds: 15 * 60 });

  const body = await readBody<{ token?: string; password?: string }>(event);
  const token = body?.token;
  const password = body?.password;
  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: "Token and password are required" });
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters" });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash));
  if (!row || row.expiresAt <= sqlTimestamp()) {
    throw createError({ statusCode: 400, statusMessage: "This reset link is invalid or has expired" });
  }

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  // Tokens are single-use: clear them all once the password has changed.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));

  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  await setUserSession(event, { user: { id: user!.id, email: user!.email } });

  return { id: user!.id, email: user!.email };
});
