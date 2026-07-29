FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache curl

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/ ./lib/
COPY api-server/ ./api-server/
RUN pnpm install --no-frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
WORKDIR /app/api-server
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api-server/node_modules ./api-server/node_modules
COPY --from=build /app/api-server/dist ./api-server/dist
WORKDIR /app/api-server
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
