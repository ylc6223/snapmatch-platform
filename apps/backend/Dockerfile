# ========== 阶段 1: 依赖安装 ==========
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm

# 复制 monorepo 配置和 lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# 复制所有工作区的 package.json（pnpm 需要它们来正确解析工作区依赖）
COPY apps/web/package.json ./apps/web/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# 复制需要构建的源码
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# 安装所有依赖（包括 devDependencies，用于构建）
# 在 Docker 中移除 --frozen-lockfile，因为 CI 环境可能存在 lockfile 时序问题
RUN pnpm install

# ========== 阶段 2: 构建 ==========
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable pnpm

# 复制依赖和源码
COPY --from=deps /app /app

# 先构建 shared-types（backend 依赖它的 dist/）
RUN pnpm --filter @snapmatch/shared-types build

# 构建应用
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN pnpm --filter @snapmatch/backend build

# ========== 阶段 3: 运行时 ==========
FROM node:20-alpine AS runner
WORKDIR /app

# 安装 pnpm
RUN corepack enable pnpm

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 复制 monorepo 配置文件
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 复制所有工作区的 package.json（pnpm workspace 需要）
COPY --from=build --chown=nestjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json

# 复制 node_modules（从 deps 阶段，已包含所有依赖）
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

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
