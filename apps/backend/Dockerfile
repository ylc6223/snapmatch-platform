# ========== 阶段 1: 依赖安装（仅 Backend 相关） ==========
FROM node:20-alpine AS deps
WORKDIR /app

# 固定 pnpm 版本，避免 corepack 每次下载不同版本导致不稳定/变慢
ARG PNPM_VERSION=10.15.0
ENV CI=1
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 复制 pnpm 配置（本仓库使用 workspace 独立 lockfile）
COPY .npmrc ./

# 复制 monorepo 配置和根 lockfile（注意：不复制全仓源码，确保缓存命中）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 仅复制 Backend 与其 workspace 依赖的 package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# 复制对应 workspace 的 lockfile（shared-workspace-lockfile=false）
COPY apps/backend/pnpm-lock.yaml ./apps/backend/pnpm-lock.yaml
COPY packages/shared-types/pnpm-lock.yaml ./packages/shared-types/pnpm-lock.yaml

# 只安装 @snapmatch/backend 及其依赖（包含 @snapmatch/shared-types），并启用 pnpm store 缓存
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
  pnpm config set store-dir /pnpm-store && \
  pnpm --filter @snapmatch/backend... install --frozen-lockfile --ignore-scripts

# ========== 阶段 2: 构建 ==========
FROM node:20-alpine AS build
WORKDIR /app
ARG PNPM_VERSION=10.15.0
ENV CI=1
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 复制依赖（node_modules + lock/manifests）
COPY --from=deps /app /app

# 再复制源码（避免源码变动导致依赖层缓存失效）
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# 先构建 shared-types（backend 依赖它的 dist/）
RUN pnpm --filter @snapmatch/shared-types build

# 构建应用
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN pnpm --filter @snapmatch/backend build

# ========== 阶段 2.5: 生产依赖（用于运行时镜像减重） ==========
FROM node:20-alpine AS prod-deps
WORKDIR /app
ARG PNPM_VERSION=10.15.0
ENV CI=1
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 复制 pnpm 配置（本仓库使用 workspace 独立 lockfile）
COPY .npmrc ./

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/backend/pnpm-lock.yaml ./apps/backend/pnpm-lock.yaml
COPY packages/shared-types/pnpm-lock.yaml ./packages/shared-types/pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
  pnpm config set store-dir /pnpm-store && \
  pnpm --filter @snapmatch/backend... install --frozen-lockfile --prod --ignore-scripts

# ========== 阶段 3: 运行时 ==========
FROM node:20-alpine AS runner
WORKDIR /app

# 安装 pnpm（仅用于运行时解析 workspace 依赖；不在容器内 install）
ARG PNPM_VERSION=10.15.0
ENV CI=1
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 复制 monorepo 配置文件
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /app/.npmrc ./.npmrc
COPY --from=build --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 复制必要的 workspace package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json

# 复制 node_modules（仅生产依赖）
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# 复制构建产物
COPY --from=build --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build --chown=nestjs:nodejs /app/apps/backend/dist ./dist

# 切换到非 root 用户
USER nestjs

# 环境变量 (运行时通过 --env-file 注入)
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000

CMD ["node", "dist/main.js"]
