# Working on Slova

Guidance for AI agents (and humans) contributing to this repo.

## Verification happens on GitHub, not locally

- **Do not run the dev server, unit tests, e2e tests, or browsers in agent
  sessions.** Write the code and push; GitHub Actions is the single
  verification gate.
- CI (`.github/workflows/ci.yml`) runs on every PR and push to `main`:
  unit tests (vitest) → production build → Playwright e2e smoke suite.
  CodeQL runs alongside it.
- After pushing, check the PR's checks; if CI is red, read the failing job's
  log (and the uploaded Playwright report artifact) and fix from there.

## Change flow

- `main` is protected: changes land only through PRs with the `test` check
  green; merge commits only; branches auto-delete after merge.
- Develop on the branch designated for the session and push with
  `git push -u origin <branch>`.
- **Never merge a PR yourself** — open it, report, and wait for the
  maintainer's explicit go-ahead.
- Keep tests in `tests/unit` and `tests/e2e` in step with code changes so CI
  stays green: new features get coverage, changed behavior gets updated
  assertions.

## Project notes

- Nuxt 4 + Nitro server routes + Drizzle/SQLite; see README.md for layout.
- Predefined test accounts (superadmin, pre-filled test user, empty user)
  are seeded on dev startup and printed to the console — credentials and
  usage rules in `TEST_USERS.md`. Use them instead of creating throwaway
  accounts.
- After editing `server/database/schema.ts`, generate a migration with
  `npm run db:generate` (this is a codegen step, not a test run) and commit
  the generated files.
- Deployment: Fly.io redeploys `main` automatically after merge.
