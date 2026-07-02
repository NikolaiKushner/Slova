import type { H3Event } from "h3";

export async function readSetInput(event: H3Event) {
  const body = await readBody<{ title?: string; description?: string }>(event);
  const title = body?.title?.trim();
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }
  return { title, description: body?.description?.trim() || null };
}

export async function readCardInput(event: H3Event) {
  const body = await readBody<{ term?: string; definition?: string }>(event);
  const term = body?.term?.trim();
  const definition = body?.definition?.trim();
  if (!term || !definition) {
    throw createError({ statusCode: 400, statusMessage: "Term and definition are required" });
  }
  return { term, definition };
}

export async function readCredentials(event: H3Event) {
  const body = await readBody<{ email?: string; password?: string }>(event);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }
  return { email, password };
}
