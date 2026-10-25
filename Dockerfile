FROM oven/bun:1.3.14-slim AS base

FROM base AS dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
COPY packages/eslint/package.json ./packages/eslint/
COPY packages/test/package.json ./packages/test/
RUN HUSKY=0 bun install --frozen-lockfile

FROM dependencies AS migrate

COPY packages/server/drizzle ./packages/server/drizzle
COPY packages/server/drizzle.config.ts ./packages/server/
COPY packages/server/src/env.ts ./packages/server/src/
COPY packages/server/src/lib/logger.levels.ts ./packages/server/src/lib/

WORKDIR /app/packages/server
ENV NODE_ENV=production
CMD ["bun", "run", "db:migrate"]

FROM dependencies AS builder

COPY packages/server/src ./packages/server/src
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/web/src ./packages/web/src
COPY packages/web/build ./packages/web/build
COPY packages/web/index.html packages/web/tsconfig.json packages/web/vite.config.ts ./packages/web/

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG KEEP_TEST_IDS=false
ENV NODE_ENV=production
RUN bun run build

FROM base AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["bun", "dist/server/index.js"]
