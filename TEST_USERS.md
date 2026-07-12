# Predefined test accounts

Three accounts are seeded automatically for local development and staging
testing. Their credentials are printed to the server console on every start
where seeding is active, so you can log in immediately after `make dev`.

| Account    | Email               | Password        | What it's for |
| ---------- | ------------------- | --------------- | ------------- |
| Superadmin | `admin@slova.local` | `superadmin123` | `role=admin` in the DB and session (`users.role`); use it when building/testing admin-only features |
| Test user  | `test@slova.local`  | `testuser123`   | Pre-filled account: 3 sets, learned cards, cards due for review right now, review history across the last two weeks (streak, heatmap and stats all populated) |
| Fresh user | `fresh@slova.local` | `freshuser123`  | Completely empty account for onboarding and first-run flows |

## When seeding runs

- `npm run dev` / `make dev` / `make docker-dev`: **always**.
- Production builds (`node .output/server/index.mjs`, `make docker`): only
  when the env var `SLOVA_SEED_USERS=1` is set. `docker-compose.yml` sets it
  for the local `prod` service.
- **Never set `SLOVA_SEED_USERS=1` on Fly.io** — these are publicly known
  passwords.

Seeding is idempotent: accounts are created only if their email doesn't
exist yet, and existing accounts (including any data you've changed in them)
are never touched. To reset an account to its seeded state, delete the user
row (cascades take the data) and restart the server — or just delete the
SQLite file (`./data/app.db*`) to start over entirely.

## Where things live

- Credentials + seed data: `server/utils/seedUsers.ts` (`SEED_USERS`)
- Startup hook + console output: `server/plugins/seed.ts`
- Coverage: `tests/unit/seedUsers.test.ts`

## Notes for AI agents

- Use `test@slova.local` when you need existing data (study queue, stats),
  `fresh@slova.local` for clean-slate flows, `admin@slova.local` for
  role-gated behavior. Don't create throwaway accounts for manual testing.
- Log in via `POST /api/auth/login` with `{ "email", "password" }` (session
  cookie), or through the login form.
- The e2e suite creates its own users and does not depend on these accounts;
  CI production builds run without `SLOVA_SEED_USERS`, so nothing is seeded
  there.
- If you change the seeded data shape, update `tests/unit/seedUsers.test.ts`
  and this file in the same PR.
