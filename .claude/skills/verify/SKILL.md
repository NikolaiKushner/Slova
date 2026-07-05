---
name: verify
description: Build, launch, and drive Slova (Nuxt 4 + SQLite) to verify changes end-to-end in a browser.
---

# Verifying Slova

## Launch

```bash
npm run dev > /tmp/dev.log 2>&1 &   # serves http://localhost:3000, ~25s cold start
```

No env vars needed in dev: `nuxt-auth-utils` generates a session password
into `.env`, and the SQLite database migrates itself on boot (data/ dir).

## Drive (Playwright)

Chromium lives at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` —
pass it as `executablePath`; do not run `playwright install`.

Gotcha: after every `page.goto(...)` wait for network idle **plus ~1s** before
clicking — clicks that land before Vue hydration fall through to native form
submits and the SPA never navigates.

Fast fixture setup: register through the UI once (POST forms need hydration),
then create sets/cards through the API with the page's own cookies:

```js
await page.request.post(`${BASE}/api/sets`, { data: { title: "S", description: "" } });
await page.request.post(`${BASE}/api/sets/${id}/cards`, { data: { term, definition } });
```

## Flows worth driving

- register → create set → add cards → Study tab
- each study mode: flashcards (Space to flip, 1/2/3 to rate), choice,
  typing, match (tiles in `div.grid > button`)
- session summary counts first answer per card; wrong answers re-queue
  (except match)
- home page stats bar (streak / reviews today / due)
