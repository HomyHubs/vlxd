# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .prettierrc.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vlxd/shared build
RUN pnpm --filter @vlxd/api-client build
RUN pnpm --filter @vlxd/web build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx/staging.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=5 --start-period=3s \
  CMD wget -qO- http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
