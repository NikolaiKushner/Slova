# Slova

A full-stack Nuxt app template: Vue 3 SSR frontend and a Nitro (Nuxt's server
engine) backend in one project, no separate API service. Ships as a tiny
Quizlet-style example — user accounts, flashcard sets, cards, and a study
mode — to demonstrate the pattern end to end.

Studying uses spaced repetition (a simplified SM-2 scheduler, as in Anki):
every answer is rated and the card's next review is scheduled further out the
better you know it. Four study modes — flip cards with self-rating, multiple
choice, typed answers with typo tolerance, and match-the-pairs — all feed the
same scheduler. The dashboard tracks due cards, a study-day streak, and
per-set progress.

Quality-of-life extras: CSV/text import and export of sets, curated
English-Russian starter packs grouped by CEFR level (A1/A2/B1), word
pronunciation via the browser's Web Speech API, and a dark theme.

## Stack

- **Nuxt 4** (Vue 3, TypeScript, SSR)
- **Nitro server routes** (`server/api/**`) as the backend — no separate
  FastAPI/Express/etc. service
- **Drizzle ORM** + **SQLite** (`better-sqlite3`), migrations via `drizzle-kit`
- **nuxt-auth-utils** for sessions (sealed cookies) and password hashing

## Why Nuxt-only

Nitro's server routes are a real backend: typed request handlers, a database,
sessions/auth, all deployed as a single Node process. For an app of this size
(flashcard sets, CRUD, auth) that's enough — you skip a second service, CORS,
and a second deploy. If the app later needs heavy background jobs (AI
generation, cron, queues) or a Python-specific ecosystem, that's the point to
consider splitting a dedicated backend back out.

## Project layout

```
app/                 Vue app (pages, layouts, middleware, components)
  pages/index.vue     Dashboard — sets with due counts, streak, reviews today
  pages/sets/[id].vue Edit cards + study setup (mode, direction, queue)
  pages/login.vue, register.vue
  components/StudySession.vue   Runs a study session, posts reviews
  components/StudyFlashcard.vue Flip card with again/hard/good self-rating
  components/StudyChoice.vue    Multiple-choice question
  components/StudyTyping.vue    Typed answer with typo tolerance
  middleware/auth.ts   Redirects to /login if not authenticated
  middleware/guest.ts  Redirects to / if already authenticated
server/
  api/auth/            register, login, logout
  api/sets/, api/cards/ CRUD, scoped to the logged-in user
  api/cards/[id]/review.post.ts  Rate a card, reschedule it (SM-2)
  api/stats.get.ts     Study-day streak, reviews today, cards due
  database/schema.ts    Drizzle schema (users, sets, cards, progress, log)
  database/migrations/  Generated SQL migrations
  utils/db.ts           Drizzle + better-sqlite3 client
  utils/srs.ts          Simplified SM-2 spaced-repetition scheduler
  utils/ownership.ts     Ownership check shared by set/card routes
  plugins/migrate.ts     Runs migrations automatically on server start
```

## Quickstart

```bash
npm install
cp .env.example .env   # sets NUXT_SESSION_PASSWORD and DATABASE_URL
npm run dev
```

Open http://localhost:3000 — register an account, create a set, add a few
term/definition cards, and try the study mode.

Migrations run automatically on server startup (see `server/plugins/migrate.ts`).
After changing `server/database/schema.ts`, generate a new migration:

```bash
npm run db:generate
```

Inspect the database with Drizzle Studio:

```bash
npm run db:studio
```

## Docker

```bash
docker build -t slova .
docker run -p 3000:3000 --env-file .env -v $(pwd)/data:/app/data slova
```

## What's included

- Email/password auth (register, login, logout) with hashed passwords and
  session cookies
- Flashcard sets: create, list, delete, per-user
- Cards within a set: add, edit, delete
- Spaced repetition: every answer (again/hard/good) reschedules the card via
  a simplified SM-2 algorithm; the study queue shows only cards that are due
- Three study modes: flip cards with self-rating, multiple choice with
  distractors from the same set, and typed answers with typo tolerance —
  in either direction (term → definition or definition → term)
- Progress & motivation: per-set learned/learning/new progress bar, "tricky
  words" list, due-count badges, reviews-today counter, and a study-day streak

## Next steps

- Swap SQLite for Postgres (`DATABASE_URL` + a different Drizzle driver) if
  you outgrow a single file.
- Add set sharing, audio pronunciation, or AI-generated example sentences.
- Move heavy/background work (AI-generated cards, scheduled review reminders)
  to a queue or separate service if Nitro's request/response model stops
  fitting.
