import { sets } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { title, description } = await readSetInput(event);

  const [set] = await db
    .insert(sets)
    .values({ userId: user.id, title, description })
    .returning();

  return set;
});
