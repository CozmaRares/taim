FROM oven/bun:1.3.14-slim AS base

FROM base AS builder

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
COPY packages/eslint/package.json ./packages/eslint/
COPY packages/test/package.json ./packages/test/
RUN HUSKY=0 bun install --frozen-lockfile

COPY packages/server ./packages/server
COPY packages/web ./packages/web

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV NODE_ENV=production
RUN bun run build

FROM base AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["bun", "dist/server/index.js"]
