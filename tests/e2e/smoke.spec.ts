import { expect, test } from "@playwright/test";

// One end-to-end pass over the core loop: landing → register → starter
// pack → daily new-card limit → study with undo → password-reset endpoints.
// Runs serially because each step builds on the previous one.

test.describe.configure({ mode: "serial" });

const EMAIL = `smoke-${Date.now()}@example.com`;
const PASSWORD = "password123";

// Clicks that land before Vue hydration fall through to native form submits,
// so give every page a beat after networkidle.
async function open(page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

test("landing renders for guests", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("stick");
  await expect(page.locator('header a[href="/register"]')).toBeVisible();
});

test("register lands on the dashboard", async ({ page }) => {
  await open(page, "/register");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "My sets" })).toBeVisible();
});

test("a big starter pack is capped by the daily new-card limit", async ({ page }) => {
  await open(page, "/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  const packs = await page.request.get("/api/starter-packs").then((r) => r.json());
  const bigPack = packs.packs.reduce((a, b) => (b.cardCount > a.cardCount ? b : a));
  expect(bigPack.cardCount).toBeGreaterThan(20);
  await page.request.post(`/api/starter-packs/${bigPack.slug}`);

  const sets = await page.request.get("/api/sets").then((r) => r.json());
  expect(sets[0].dueCount).toBe(20);

  const stats = await page.request.get("/api/stats").then((r) => r.json());
  expect(stats.dueTotal).toBe(20);

  const detail = await page.request.get(`/api/sets/${sets[0].id}`).then((r) => r.json());
  expect(detail.newCardsRemainingToday).toBe(20);
});

test("studying a flashcard and undoing the answer", async ({ page }) => {
  await open(page, "/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  const sets = await page.request.get("/api/sets").then((r) => r.json());
  await open(page, `/sets/${sets[0].id}`);
  await page.getByRole("button", { name: "Study" }).click();
  await page.getByRole("button", { name: "Start studying" }).click();
  await expect(page.getByText("1 /")).toBeVisible();

  // Flip, rate, and confirm both the session counter and the server moved.
  await page.locator("div.cursor-pointer").first().click();
  await page.getByRole("button", { name: /Good/ }).click();
  await expect(page.getByText("2 /")).toBeVisible();
  let stats = await page.request.get("/api/stats").then((r) => r.json());
  expect(stats.reviewsToday).toBe(1);

  // Undo rewinds the counter and removes the review server-side.
  await page.getByRole("button", { name: /Undo/ }).click();
  await expect(page.getByText("1 /")).toBeVisible();
  stats = await page.request.get("/api/stats").then((r) => r.json());
  expect(stats.reviewsToday).toBe(0);
});

test("sharing a set: public page works, copying needs auth", async ({ page, browser }) => {
  await open(page, "/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  const sets = await page.request.get("/api/sets").then((r) => r.json());
  const share = await page.request
    .post(`/api/sets/${sets[0].id}/share`, { data: { enabled: true } })
    .then((r) => r.json());
  expect(share.isPublic).toBe(1);
  expect(share.shareSlug).toBeTruthy();

  // Anyone with the link sees the cards without an account.
  const anonContext = await browser.newContext();
  const anon = await anonContext.newPage();
  await anon.goto(`/s/${share.shareSlug}`, { waitUntil: "networkidle" });
  await expect(anon.getByText("Shared set")).toBeVisible();
  await expect(anon.getByRole("heading", { name: sets[0].title })).toBeVisible();

  // ...but copying requires logging in.
  const copyAnon = await anon.request.post(`/api/public/sets/${share.shareSlug}/copy`, {
    failOnStatusCode: false,
  });
  expect(copyAnon.status()).toBe(401);
  await anonContext.close();

  // The owner can unshare; the public page then 404s.
  await page.request.post(`/api/sets/${sets[0].id}/share`, { data: { enabled: false } });
  const gone = await page.request.get(`/api/public/sets/${share.shareSlug}`, {
    failOnStatusCode: false,
  });
  expect(gone.status()).toBe(404);
});

test("AI endpoints are cleanly disabled without an API key", async ({ page }) => {
  await open(page, "/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  const status = await page.request.get("/api/ai/status").then((r) => r.json());
  expect(status.enabled).toBe(false);

  const gen = await page.request.post("/api/ai/generate", {
    data: { mode: "topic", input: "travel", count: 6 },
    failOnStatusCode: false,
  });
  expect(gen.status()).toBe(503);

  // The AI controls stay hidden in the editor.
  const sets = await page.request.get("/api/sets").then((r) => r.json());
  await open(page, `/sets/${sets[0].id}`);
  await expect(page.getByText("Generate cards with AI")).toHaveCount(0);
});

test("password-reset endpoints behave", async ({ request }) => {
  // Identical response for known and unknown emails (no enumeration).
  const known = await request.post("/api/auth/forgot", { data: { email: EMAIL } });
  expect(known.ok()).toBe(true);
  const unknown = await request.post("/api/auth/forgot", { data: { email: "ghost@nowhere.io" } });
  expect(unknown.ok()).toBe(true);

  // Garbage tokens are rejected.
  const bad = await request.post("/api/auth/reset", {
    data: { token: "not-a-real-token", password: "whatever-123" },
  });
  expect(bad.status()).toBe(400);
});
