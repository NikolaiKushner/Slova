import { createTransport } from "nodemailer";

// Sends via SMTP when configured (SMTP_HOST & friends in .env); without it,
// prints the message to the server console so the flow still works out of
// the box in development.
export async function sendMail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(
      `[mail] SMTP not configured — email for ${to}:\n  Subject: ${subject}\n  ${text.replace(/\n/g, "\n  ")}`,
    );
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || "Slova <no-reply@localhost>",
    to,
    subject,
    text,
  });
}
