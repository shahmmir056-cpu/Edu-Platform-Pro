FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apk add --no-cache curl

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/ai-study-hub/package.json ./artifacts/ai-study-hub/

# Remove esbuild platform overrides that conflict with Linux
RUN sed -i '/"@esbuild\/linux/d; /"@esbuild\/freebsd/d; /"@esbuild\/netbsd/d; /"@esbuild\/openbsd/d; /"@esbuild\/sunos/d; /"@esbuild\/aix/d; /"@esbuild\/android/d; /"@esbuild\/openharmony/d' pnpm-workspace.yaml
RUN sed -i '/"lightningcss>lightningcss-linux-arm/d; /"lightningcss>lightningcss-linux-x64-musl/d' pnpm-workspace.yaml
RUN sed -i '/"@tailwindcss\/oxide>@tailwindcss\/oxide-linux/d' pnpm-workspace.yaml
RUN sed -i '/rollup>@rollup\/rollup-linux/d' pnpm-workspace.yaml
RUN sed -i '/"@expo\/ngrok-bin>@expo\/ngrok-bin-linux/d' pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile || pnpm install

# --- build api-server ---
FROM base AS api-build
WORKDIR /app
COPY --from=deps /app ./
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# --- build frontend ---
FROM base AS frontend-build
WORKDIR /app
COPY --from=deps /app ./
ENV PORT=10000
ENV BASE_PATH=/
ENV NODE_ENV=production
WORKDIR /app/artifacts/ai-study-hub
RUN pnpm run build

# --- production ---
FROM base AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/lib ./lib
COPY --from=deps /app/artifacts/api-server/package.json ./artifacts/api-server/
COPY --from=deps /app/artifacts/ai-study-hub/package.json ./artifacts/ai-study-hub/

COPY --from=api-build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=frontend-build /app/artifacts/ai-study-hub/dist/public ./artifacts/ai-study-hub/dist/public

ENV NODE_ENV=production
ENV PORT=10000
ENV PUBLIC_DIR=/app/artifacts/ai-study-hub/dist/public

EXPOSE 10000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
