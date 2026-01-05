# ========== 阶段 1: 依赖安装 ==========
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm

# 复制 monorepo 根目录的依赖文件
COPY package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# 安装所有依赖（包括 devDependencies，用于构建）
RUN pnpm install --frozen-lockfile

# ========== 阶段 2: 构建 ==========
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable pnpm

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制 monorepo 配置文件（必需）
COPY package.json pnpm-lock.yaml* ./

# 复制源码
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

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

# 复制生产依赖（从 build 阶段）
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules

# 复制构建产物
COPY --from=build --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json

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
