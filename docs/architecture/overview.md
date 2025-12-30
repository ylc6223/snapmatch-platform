# SnapMatch Platform 项目结构文档

> 最后更新: 2025-12-31

## 📦 项目概览

**SnapMatch Platform** 是一个 **Monorepo 架构的摄影工作室管理平台**，采用 pnpm workspace 作为包管理器。项目包含三个主要应用（Web官网、Admin管理后台、Backend API）+ 共享包的结构，并集成了完整的 CI/CD 部署流程。

---

## 📂 顶层目录结构

```
snapmatch-platform/
├── apps/                          # 核心应用
│   ├── web/                      # 官网 (Next.js)
│   ├── admin/                    # 管理后台 (Next.js)
│   └── backend/                  # 后端 API (NestJS)
├── packages/                     # 预留共享组件库
├── docs/                         # 项目文档
│   ├── deployment/               # 部署文档
│   ├── admin/                    # Admin 架构/鉴权文档
│   ├── backend/                  # Backend 开发文档
│   └── conventions/              # 命名规范
├── scripts/                      # 服务器配置脚本
├── .github/workflows/            # CI/CD 流程
├── rules/                        # AI 编辑器规则配置
└── cloudbaserc.json             # CloudBase 配置
```

---

## 🎯 三大核心应用

### 1️⃣ Web（官网）- `/apps/web`

**用途**: 摄影工作室官网，面向客户端

| 指标     | 详情                                        |
| -------- | ------------------------------------------- |
| 框架     | Next.js 16.0.10 + React 19.2.0 + TypeScript |
| 输出方式 | `output: 'export'`（静态导出）              |
| 部署路径 | 根路径 `/`                                  |
| 包名     | `@snapmatch/web`                            |
| 启动端口 | 3000（开发环境）                            |

#### 关键技术栈

```json
{
  "dependencies": {
    "@radix-ui/*": "完整组件库",
    "next": "16.0.10",
    "react": "19.2.0",
    "react-hook-form": "^7.60.0",
    "zod": "3.25.76",
    "recharts": "2.15.4",
    "tailwindcss": "^4.1.9"
  }
}
```

**技术亮点**:

- UI 组件：Radix UI（完整组件库）+ TailwindCSS 4
- 表单管理：React Hook Form + Zod
- 图表：Recharts 2
- 动画：Tailwind CSS Animate
- 分析：Vercel Analytics

#### 页面结构

```
apps/web/app/
├── fonts/
├── login/
├── globals.css
├── layout.tsx
└── page.tsx
```

---

### 2️⃣ Admin（管理后台）- `/apps/admin`

**用途**: 完整的管理后台系统，内部管理员使用

| 指标     | 详情                                       |
| -------- | ------------------------------------------ |
| 框架     | Next.js 16.1.0 + React 19.2.3 + TypeScript |
| 输出方式 | `output: 'standalone'`（服务端运行）       |
| 部署路径 | `/admin`（子路径）                         |
| 包名     | `@snapmatch/admin`                         |
| 版本     | 0.5.9                                      |
| 启动端口 | 3001（开发环境）                           |

#### 关键技术栈

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.21.3",
    "@dnd-kit/*": "拖拽排序库",
    "@mdxeditor/editor": "^3.52.1",
    "axios": "^1.13.2",
    "zustand": "^5.0.9",
    "recharts": "2.15.4"
  }
}
```

**技术亮点**:

- UI 组件：Radix UI + TailwindCSS 4
- 数据表格：TanStack React Table
- 拖拽排序：dnd-kit
- 数据请求：Axios + TanStack Query（全局错误处理）
- 编辑器：MDXEditor
- 状态管理：Zustand
- 数据生成：Faker.js（开发测试）

#### 应用结构

```
apps/admin/app/
├── (guest)/          # 游客路由组（登录页）
├── api/              # Route Handlers（后端代理）
│   └── [...path]/    # 代理所有后端 API 请求
├── dashboard/        # 仪表板
│   ├── settings/     # 设置页
│   ├── users/        # 用户管理
│   ├── data.json     # 模拟数据
│   └── layout.tsx
├── globals.css
├── layout.tsx
└── favicon.ico
```

#### 核心功能

- ✅ 登录鉴权（JWT）
- ✅ RBAC 权限管理（Roles + Permissions）
- ✅ 用户管理（Dashboard）
- ✅ 设置界面
- ✅ 会话踢出机制
- ✅ 会话过期 UI 规范

**路由处理**: 通过 `app/api/[...path]/` 实现后端 API 代理（Route Handlers）

---

### 3️⃣ Backend（后端 API）- `/apps/backend`

**用途**: 核心 API 服务，为 Admin/Web 提供数据接口

| 指标     | 详情                         |
| -------- | ---------------------------- |
| 框架     | NestJS 11.0.0 + TypeScript   |
| 包名     | `@snapmatch/backend`         |
| 版本     | 0.1.0                        |
| 启动端口 | 3002（开发）/ 3000（生产）   |
| 容器化   | ✅ 支持（Docker 多阶段构建） |

#### 关键技术栈

```json
{
  "dependencies": {
    "@nestjs/*": "核心框架包",
    "@nestjs/jwt": "JWT 管理",
    "@nestjs/passport": "认证策略",
    "@cloudbase/node-sdk": "^3.16.0",
    "bcryptjs": "密码加密",
    "class-validator": "DTO 验证",
    "passport-jwt": "JWT 策略"
  }
}
```

**技术亮点**:

- 框架：NestJS（模块化、依赖注入）
- 认证：JWT + Passport + passport-jwt
- 数据库：CloudBase Node SDK + CloudBase 数据模型
- 密码加密：bcryptjs
- 参数验证：class-validator + class-transformer
- 测试：Jest

#### 后端模块结构

```
apps/backend/src/
├── main.ts              # 应用入口（CORS、ValidationPipe、启动）
├── app.module.ts        # 全局模块装配 + 全局 Guard（JWT/Roles/Permissions）
├── auth/                # 鉴权与权限模块
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── decorators/      # @CurrentUser, @Roles, @Permissions, @Public
│   ├── dto/             # LoginDto, RefreshDto, LogoutDto
│   ├── guards/          # JwtAuthGuard, RolesGuard, PermissionsGuard
│   ├── strategies/      # JWT 策略
│   ├── sessions/        # 会话管理（CloudBase）
│   └── types.ts
├── users/               # 用户管理模块
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── users.repository.cloudbase.ts  # CloudBase 数据模型接口
├── database/            # CloudBase 集成
│   ├── cloudbase.module.ts
│   └── cloudbase.constants.ts
├── common/              # 全局工具
│   ├── filters/         # API 异常过滤器
│   ├── interceptors/    # 响应 Envelope 拦截器
│   └── types/
├── health/              # 健康检查
├── scripts/             # CLI 脚本（密码Hash、RBAC初始化）
└── types/
```

#### 核心特性

| 特性     | 实现                                                                |
| -------- | ------------------------------------------------------------------- |
| 鉴权     | JWT（Bearer Token）+ Refresh Token                                  |
| 授权     | RBAC（角色/权限）+ 数据作用域                                       |
| 持久化   | CloudBase 数据模型：`rbac_users`, `auth_sessions` 等                |
| 会话管理 | Refresh Token TTL（30天）+ 会话踢出                                 |
| CORS     | 仅允许 Admin 来源（默认 `http://localhost:3001`）                   |
| 验证     | class-validator DTO + ValidationPipe                                |
| 错误处理 | 统一 API 响应 Envelope：`{ code, message, data/errors, timestamp }` |

#### 环境变量

参考 `.env.example`:

```bash
PORT=3002
NODE_ENV=development
ADMIN_ORIGIN=http://localhost:3001
JWT_SECRET=change-me
JWT_EXPIRES_IN=12h
AUTH_REFRESH_TOKEN_TTL_DAYS=30
CLOUDBASE_ENV=<env_id>
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=<secret_id>
CLOUDBASE_SECRET_KEY=<secret_key>
CLOUDBASE_MODEL_USERS=rbac_users
CLOUDBASE_MODEL_AUTH_SESSIONS=auth_sessions
```

#### API 约定

- **基础路径**: `/api`（由 Nginx 反代）
- **响应格式（成功）**:
  ```json
  {
    "code": 200,
    "message": "OK",
    "data": { ... },
    "timestamp": "2025-01-01T00:00:00Z"
  }
  ```
- **响应格式（失败）**:
  ```json
  {
    "code": 400,
    "message": "Error",
    "errors": [...],
    "timestamp": "2025-01-01T00:00:00Z"
  }
  ```
- **认证**: `Authorization: Bearer <jwt_token>`

---

## 🏗️ 架构设计

### 系统架构图

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Web (3000)      │     │ Admin (3001)     │────▶│ Backend (3002) │
│                 │     │                  │     │                │
│ 静态站点         │     │ SSR 应用         │     │ NestJS API     │
│ Next.js Export  │     │ Route Handlers   │     │ JWT + RBAC     │
│                 │     │ Proxy to Backend │     │                │
└─────────────────┘     └──────────────────┘     └────────┬───────┘
                                                           │
                                                           ▼
                                                  ┌────────────────┐
                                                  │ CloudBase      │
                                                  │ 数据模型 (7表) │
                                                  │                │
                                                  │ - rbac_users   │
                                                  │ - auth_sessions│
                                                  │ - rbac_roles   │
                                                  │ - ...          │
                                                  └────────────────┘
```

### 数据库模型（CloudBase）

| 表名                    | 用途                                           |
| ----------------------- | ---------------------------------------------- |
| `rbac_users`            | 用户账户（username, password_hash, roles）     |
| `auth_sessions`         | 会话记录（user_id, refresh_token, expires_at） |
| `rbac_roles`            | 角色定义                                       |
| `rbac_permissions`      | 权限定义                                       |
| `rbac_user_roles`       | 用户角色关联                                   |
| `rbac_role_permissions` | 角色权限关联                                   |
| `rbac_role_data_scopes` | 数据作用域                                     |

### RBAC 权限架构

**3级权限检查**（全局 Guard 顺序）:

1. **JWT 校验** + `@Public()` 放行
2. **角色检查** + `admin` 兜底
3. **权限检查** + `"*"` 通配符

---

## 🔧 工作区配置

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 根目录脚本

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev", // 同时启动所有应用
    "build": "pnpm -r build", // 构建所有应用
    "lint": "pnpm -r lint", // Lint 所有应用
    "dev:web": "pnpm -C apps/web dev",
    "dev:admin": "pnpm -C apps/admin dev",
    "dev:backend": "pnpm -C apps/backend dev",
    "build:web": "pnpm -C apps/web build",
    "build:admin": "pnpm -C apps/admin build",
    "build:backend": "pnpm -C apps/backend build"
  }
}
```

---

## 🚀 本地开发快速启动

### 一键启动所有服务

```bash
# 安装所有依赖
pnpm install

# 同时启动三个应用
pnpm dev
```

### 分别启动服务

```bash
# Web 官网
pnpm dev:web        # http://localhost:3000

# Admin 后台
pnpm dev:admin      # http://localhost:3001

# Backend API
pnpm dev:backend    # http://localhost:3002
```

### 环境变量配置

每个应用都需要配置 `.env` 文件（参考各自的 `.env.example`）:

- **Web**: 主要是 API 地址配置
- **Admin**: API 代理配置、认证配置
- **Backend**: 完整的 CloudBase + JWT 配置

---

## 📦 部署方案

### 部署方式

项目支持两种部署方案：

| 方案       | 适用场景         | 配置方式       | 文档                           |
| ---------- | ---------------- | -------------- | ------------------------------ |
| 标准 Nginx | 全新服务器       | 手动编辑 Nginx | `docs/deployment/access.md`    |
| 1Panel     | 已有 1Panel 面板 | Web 界面配置   | `docs/deployment/ip-access.md` |

**部署目录**: `/var/www/snapmatch`

### Docker 支持

Backend 应用提供完整的 Dockerfile（3阶段构建）:

1. **deps**: 依赖安装
2. **build**: 应用构建
3. **runner**: 最小运行时（非 root 用户）

```bash
# 构建镜像
docker build -t snapmatch-backend:v1.0.0 ./apps/backend

# 运行容器
docker run -p 3000:3000 --env-file .env snapmatch-backend:v1.0.0
```

**健康检查**: `GET /health` on port 3000

### GitHub Actions CI/CD

**文件**: `.github/workflows/deploy-production.yml`

**触发条件**: 推送版本标签

```bash
git tag v1.0.0
git push origin v1.0.0
```

**流程**:

1. **代码质量检查** (quality-check):
   - Lint 检查（Web/Admin/Backend）
   - TypeScript 类型检查
   - Backend 单元测试（Jest）

2. **部署 Backend**:
   - 构建 Docker 镜像
   - 推送到镜像仓库

3. **部署前端** (Web/Admin):
   - 构建静态文件
   - 部署到 Nginx

**域名配置**: `www.thepexels.art`（可在 workflow 中修改）

---

## 📚 文档体系

```
docs/
├── README.md                                # 文档索引
├── project-structure.md                     # 本文档（项目结构）
├── deployment/
│   ├── overview.md                          # 部署总览
│   ├── access.md                            # Nginx 域名部署
│   ├── ip-access.md                         # IP + 1Panel 部署
│   ├── troubleshooting.md                   # 问题排查
│   └── admin-subdomain-migration.md         # Admin 子域名迁移
├── admin/
│   ├── README.md                            # Admin 文档索引
│   ├── architecture-and-deployment.md       # 架构与部署
│   ├── auth-rbac-design.md                  # RBAC 设计
│   ├── auth-session-kickout.md              # 会话踢出
│   ├── session-expired-ui-spec.md           # 会话过期 UI 规范
│   ├── tanstack-query-global-error-handling.md # 全局错误处理
│   ├── api-strategy.md                      # API 策略
│   └── assets/                              # SVG 架构图
├── backend/
│   └── README.md                            # Backend 开发说明
└── conventions/
    └── naming.md                            # 命名规范
```

---

## 📊 技术选型总结

| 层            | 技术栈                   |
| ------------- | ------------------------ |
| **前端框架**  | Next.js 16 + React 19    |
| **UI 组件库** | Radix UI + TailwindCSS 4 |
| **状态管理**  | Zustand                  |
| **数据请求**  | TanStack Query + Axios   |
| **表单验证**  | React Hook Form + Zod    |
| **后端框架**  | NestJS 11                |
| **认证**      | JWT + Passport           |
| **数据库**    | CloudBase 数据模型       |
| **包管理**    | pnpm 10.15.0             |
| **容器化**    | Docker                   |
| **部署**      | Nginx + GitHub Actions   |
| **监控**      | 健康检查（/health 端点） |

---

## 🗂️ 关键文件位置速查表

| 功能                 | 文件路径                                   |
| -------------------- | ------------------------------------------ |
| Web 首页             | `/apps/web/app/page.tsx`                   |
| Web 登录             | `/apps/web/app/login/`                     |
| Admin 登录           | `/apps/admin/app/(guest)/login/`           |
| Admin 仪表板         | `/apps/admin/app/dashboard/`               |
| Admin API 代理       | `/apps/admin/app/api/[...path]/`           |
| Backend 入口         | `/apps/backend/src/main.ts`                |
| Backend 认证 API     | `/apps/backend/src/auth/`                  |
| Backend 用户管理     | `/apps/backend/src/users/`                 |
| Backend Dockerfile   | `/apps/backend/Dockerfile`                 |
| Web 环境变量模板     | `/apps/web/.env.example`                   |
| Admin 环境变量模板   | `/apps/admin/.env.example`                 |
| Backend 环境变量模板 | `/apps/backend/.env.example`               |
| 部署脚本             | `/scripts/server-setup.sh`                 |
| CI/CD 工作流         | `/.github/workflows/deploy-production.yml` |
| CloudBase 配置       | `/cloudbaserc.json`                        |

---

## 📈 项目规模统计

| 指标           | 数值                                      |
| -------------- | ----------------------------------------- |
| 核心应用数     | 3（Web + Admin + Backend）                |
| 数据模型表     | 7 个（RBAC + 会话）                       |
| CI/CD Workflow | 2 个（质量检查、生产部署）                |
| 部署脚本       | 2 个（server-setup.sh、manual-deploy.sh） |
| 文档页数       | 15+ 个 Markdown 文件                      |

---

## 🎯 架构亮点

### 1. Monorepo 优势

- 三个应用共享 TypeScript 配置、Lint 规则
- 统一依赖管理，减少重复安装
- 原子化提交，保证多应用版本一致性

### 2. RBAC 权限设计

- Backend 通过 NestJS Guards 实现细粒度权限控制
- 支持角色继承和数据作用域
- `admin` 角色拥有所有权限（兜底机制）

### 3. API 代理模式

- Admin 使用 Next.js Route Handlers 代理后端
- 避免浏览器 CORS 问题
- 支持服务端预渲染（SSR）

### 4. Docker 多阶段构建

- 最小化生产镜像体积
- 非 root 用户运行（安全性）
- 健康检查内置

### 5. 自动化部署

- 基于版本标签触发
- 质量检查 → 构建 → 部署全流程自动化
- 支持多环境配置

---

## 🔗 相关资源

- **部署文档**: [docs/deployment/overview.md](./deployment/overview.md)
- **Admin 架构**: [docs/admin/architecture-and-deployment.md](./admin/architecture-and-deployment.md)
- **Backend 开发**: [docs/backend/README.md](./backend/README.md)
- **命名规范**: [docs/conventions/naming.md](./conventions/naming.md)

---

## 📝 维护说明

本文档应在以下情况更新：

- ✅ 添加新的应用或包
- ✅ 修改核心架构设计
- ✅ 更新技术栈版本
- ✅ 调整部署流程
- ✅ 新增重要功能模块

**最后更新**: 2025-12-31
**维护者**: SnapMatch Platform Team
