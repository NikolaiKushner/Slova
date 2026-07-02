FROM node:22-slim AS base
WORKDIR /app
# better-sqlite3 falls back to compiling from source on platforms without a
# prebuilt binary, so make sure a toolchain is available.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Used for local development (hot reload via bind mounts).
FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
COPY . .
RUN npm run build

# Default production image.
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
