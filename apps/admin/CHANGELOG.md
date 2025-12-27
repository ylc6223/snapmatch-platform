# Changelog（Admin）

本文件用于记录 `apps/admin` 的功能改动与开发进度，便于回溯与协作。

格式参考（非严格）：每次记录必须携带一个版本号，避免同一天日志过长；优先说明“做了什么、涉及哪些关键文件/接口、如何验证”。

版本号建议：遵循语义化版本（SemVer）并以 patch 为主（例如 `0.5.0` → `0.5.1` → `0.5.2`）。

---

## 0.5.9 - 2025-12-27

### 新增

- Dashboard 顶部多标签页（Tabbar），提供 vben 风格能力（关闭/固定/右键菜单/拖拽/持久化）
  - Tabbar 组件：`apps/admin/components/dashboard-tabbar.tsx`
  - 路由 meta 配置：`apps/admin/lib/navigation/dashboard-tabs.ts`
  - 全局状态：Zustand store（持久化）：`apps/admin/lib/store/app-store.ts`

### 变更

- Dashboard Header 结构对齐 shadcn sidebar 示例：面包屑 + Tabbar（同一风格体系）
  - `apps/admin/components/site-header.tsx`
  - `apps/admin/app/dashboard/layout.tsx`
- Sidebar 折叠态二级菜单交互升级：折叠(icon) 时使用 dropdown，展开时保留 collapsible 层级
  - `apps/admin/components/nav-main.tsx`

### 验证

- `pnpm -C apps/admin lint`（无 error，仅存在项目原有 warning）

## 0.5.1 - 2025-12-26

### 新增

- 接入后端登录与会话（同源 BFF + HttpOnly Cookie）
  - 新增 BFF 接口：`POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/logout`
  - 服务端后端请求封装：`apps/admin/lib/api/backend.ts`
  - Cookie 会话封装：`apps/admin/lib/auth/session.ts`、`apps/admin/lib/auth/constants.ts`
  - 环境变量示例：`apps/admin/.env.example`（`BACKEND_BASE_URL`）

### 变更

- 登录页从“前端假校验”切换为真实调用后端登录：`apps/admin/app/(guest)/login/login-form.tsx`
- 增加路由保护：`apps/admin/middleware.ts` 保护 `/dashboard/:path*`，未登录跳转 `/login?next=...`，并将 `/` 重定向到 `/dashboard`
- Dashboard 布局服务端校验登录态并注入当前用户：`apps/admin/app/dashboard/layout.tsx`
- 基础 RBAC（展示层）接入：`apps/admin/lib/auth/can.ts` + `apps/admin/components/app-sidebar.tsx`（示例：Users 菜单仅 admin 可见）
- 退出登录：`apps/admin/components/nav-user.tsx` 调用 `/api/auth/logout` 并跳转 `/login`

### 验证

- `pnpm -C apps/admin lint`（无 error，仅存在项目原有 warning）

## 0.5.2 - 2025-12-26

### 变更

- 统一错误返回约定为 `code + message`（前端仅对接 BFF，不透出后端原始结构）
  - 后端 `/auth/login`、`/auth/me` 返回标准 `{ code, message }`（401 场景）
  - Admin BFF 统一返回 `{ code, message }`，生产环境默认不返回 `detail`

### 影响范围

- `apps/backend/src/auth/auth.controller.ts`
- `apps/admin/app/api/auth/*`

## 0.5.3 - 2025-12-26

### 修复

- 修复 Next.js 16 中 `middleware.ts` 与 `proxy.ts` 冲突导致构建失败/路由异常的问题
  - 使用 `apps/admin/proxy.ts` 统一承载：`/` → `/dashboard` 与 `/dashboard/*` 登录态拦截
  - 移除 `apps/admin/middleware.ts`

## 0.5.4 - 2025-12-26

### 修复

- 修复在部分网络环境下使用 `next/font/google` 拉取字体导致页面路由构建异常的问题
  - 移除 `apps/admin/app/layout.tsx` 中的 Google Fonts（`Inter`）依赖，避免访问 `fonts.googleapis.com`

## 0.5.5 - 2025-12-26

### 变更

- 登录与错误响应体验优化
  - 后端统一错误响应为 `{ code, message }`（包含 DTO 校验失败的 400 场景），不再返回 Nest 默认 `{ statusCode, message[] }`
  - Admin 登录表单默认值改为空，避免默认触发后端 `MinLength(6)` 校验

### 影响范围

- `apps/backend/src/common/filters/api-exception.filter.ts`
- `apps/backend/src/main.ts`
- `apps/admin/app/(guest)/login/login-form.tsx`

## 0.5.6 - 2025-12-26

### 修复

- 修复错误响应 `detail` 结构重复嵌套的问题
  - Admin BFF 优先透传后端标准错误结构，不再把后端整个错误对象重复塞入 `detail`
- 后端校验错误更符合前端消费
  - `REQUEST_VALIDATION_ERROR` 增加 `errors` 字段（数组），开发环境下 `detail` 才包含原始响应

### 影响范围

- `apps/admin/lib/api/errors.ts`
- `apps/admin/app/api/auth/login/route.ts`
- `apps/admin/app/api/auth/me/route.ts`
- `apps/backend/src/common/filters/api-exception.filter.ts`

## 0.5.7 - 2025-12-26

### 变更

- 后端与 Admin BFF 统一标准响应体（envelope）
  - 成功：`{ code: 200, message: "success", data: ..., timestamp }`
  - 失败：`{ code: <业务码>, message, errors?, timestamp }`
  - 表单校验失败：`errors` 采用 `{ field, reason }[]` 结构
- Admin BFF 不再对后端错误做二次嵌套包装，避免 `detail` 重复

### 影响范围

- `apps/backend/src/main.ts`
- `apps/backend/src/common/interceptors/response-envelope.interceptor.ts`
- `apps/backend/src/common/filters/api-exception.filter.ts`
- `apps/backend/src/common/types/api-response.ts`
- `apps/admin/lib/api/response.ts`
- `apps/admin/app/api/auth/*`

## 0.5.8 - 2025-12-26

### 修复

- 标准响应体严格对齐：移除错误响应中的 `detail`，避免出现 `code/message` 重复嵌套
  - 后端对外响应严格使用 `{ code, message, data?, errors?, timestamp }`
