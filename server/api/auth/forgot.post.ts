import { createHash, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { passwordResetTokens, users } from "../../database/schema";

const TOKEN_TTL_MINUTES = 60;

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, "forgot", { limit: 5, windowSeconds: 15 * 60 });

  const body = await readBody<{ email?: string }>(event);
  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "Email is required" });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user) {
    // Only the hash is stored; the raw token exists solely in the email link.
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = sqlTimestamp(new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000));

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    const url = `${getRequestURL(event).origin}/reset-password?token=${token}`;
    await sendMail(
      email,
      "Reset your Slova password",
      `Someone (hopefully you) asked to reset the password for this account.\n\n` +
        `Open this link to choose a new password:\n${url}\n\n` +
        `The link expires in ${TOKEN_TTL_MINUTES} minutes. ` +
        `If you didn't request this, just ignore this email — your password stays as it is.`,
    );
  }

  // Same response whether or not the account exists, so the endpoint can't
  // be used to probe which emails are registered.
  return { ok: true };
});
