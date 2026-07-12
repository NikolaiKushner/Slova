.PHONY: dev docker docker-dev docker-down test db-studio help

# Run the app locally with hot reload. Bootstraps .env and node_modules
# on first run; migrations apply automatically on server start.
dev: .env node_modules
	npm run dev

# Run the production image (same stages Fly.io builds), DB persisted in ./data.
docker: .env
	docker compose up --build prod

# Hot-reload dev server inside Docker instead of natively.
docker-dev: .env
	docker compose up --build dev

docker-down:
	docker compose down

test: node_modules
	npm test

db-studio: node_modules
	npm run db:studio

# .env has no prerequisites on purpose: created once, never overwritten.
.env:
	cp .env.example .env
	SECRET=$$(openssl rand -hex 32); \
	perl -pi -e "s/change-me-to-a-random-32-character-secret/$$SECRET/" .env
	@echo "Created .env with a generated NUXT_SESSION_PASSWORD"

node_modules: package.json package-lock.json
	npm install
	@touch node_modules

help:
	@grep -E '^[a-z-]+:' Makefile | cut -d: -f1 | sort
