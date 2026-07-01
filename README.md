# FastAPI + Nuxt Template

A clean starting point for a small full-stack app: a Python/FastAPI backend and a
Nuxt (Vue 3) frontend, wired together and ready to run locally or in Docker.

## Stack

- **Backend**: FastAPI, async SQLAlchemy 2.0 + SQLite (via `aiosqlite`), Alembic
  migrations, dependency management with [`uv`](https://docs.astral.sh/uv/),
  tests with `pytest` + `httpx`.
- **Frontend**: Nuxt 4 (Vue 3), TypeScript, SSR, talks to the backend over
  `fetch`/CORS.
- **Local dev**: `docker compose up` runs both services with hot reload, or
  run each natively in its own terminal.

## Project layout

```
backend/    FastAPI app (app/, alembic/, tests/)
frontend/   Nuxt app (app/)
docker-compose.yml
```

## Quickstart — Docker Compose

```bash
cp .env.example .env   # optional, defaults work out of the box
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:3000

Both services are bind-mounted for hot reload: editing `backend/app/**` reloads
uvicorn, editing `frontend/app/**` reloads the Nuxt dev server.

## Quickstart — running natively

### Backend

```bash
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload
```

Apply database migrations (creates `app.db` via SQLite):

```bash
uv run alembic upgrade head
```

Run tests:

```bash
uv run pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend reads the backend URL from `NUXT_PUBLIC_API_BASE` (defaults to
`http://localhost:8000`).

## What's included

- `GET /api/health` — health check
- `GET/POST /api/items`, `GET/DELETE /api/items/{id}` — example CRUD resource
  backed by SQLAlchemy + Alembic, demonstrated on the frontend's home page
  (add/list/delete items, live backend status indicator).

## Next steps

- Swap SQLite for Postgres by changing `DATABASE_URL` (async SQLAlchemy +
  Alembic already support it — just add the `asyncpg` driver).
- Add authentication, more resources, and pages as the app grows.
