# Admin：使用 TanStack Query 做“全局拦截器/统一错误处理”的方案草案

本文目标：在 `apps/admin` 中引入 TanStack Query（`@tanstack/react-query`），把**所有客户端数据请求**收敛到统一入口，从而实现类似主流 Admin 项目的：

- 全局 401 处理（弹出“会话失效”对话框、引导重新登录）
- 全局错误提示（toast / 错误页兜底）
- 可控的重试、缓存、失效刷新（invalidate）
- 与现有“BFF 静默续期（refresh）”协同

> 约束：你们的后台是 Next.js App Router，且大量页面在服务端渲染（Server Components）做鉴权；因此**服务端跳转**仍会存在。但对于客户端发起的数据请求，TanStack Query 能提供非常接近“全局拦截器”的体验。

---

## 1. 现状（已落地的基础设施）

### 1.1 BFF 静默续期（推荐保留）

`GET /api/auth/me`（BFF）已经实现：

1) 后端 `/auth/me` 返回 401 → 读取 `admin_refresh_token`  
2) 调用后端 `/auth/refresh` → 写回新 cookie  
3) 重试 `/auth/me`  
4) 仍失败才清 cookie 并返回 401

这意味着：多数“access token 过期”不会打断用户。

### 1.2 会话失效弹窗事件总线（已落地）

客户端已经有一个全局“会话失效”对话框：

- 事件：`apps/admin/lib/api/session-expired.ts`
- UI：`apps/admin/components/session-expired-dialog.tsx`（shadcn Dialog）
- 全局挂载：`apps/admin/app/layout.tsx` → `apps/admin/components/providers.tsx`

后续无论是 TanStack Query，还是自定义 `fetch` 封装，都可以在检测到 401 时调用 `emitSessionExpired()`。

---

## 2. 引入 TanStack Query 的核心设计

### 2.1 全局 QueryClient（Providers）

在 `apps/admin/components/providers.tsx` 中创建 `QueryClient` 并包裹整个应用：

- `QueryClientProvider`
- （可选）`ReactQueryDevtools`（仅开发环境）

并设置默认策略（示例方向）：

- `retry: false`（默认不重试，避免 401/403 被反复请求）
- 对于幂等 GET 可按需开启有限重试（网络失败）
- `staleTime`/`gcTime` 依据页面性质调整

### 2.2 统一 queryFn：只允许请求 `/api/*`

约束客户端请求只打 `apps/admin` 的 BFF（同源 `/api/*`），避免 CORS 与 token 泄露：

- queryFn 内部使用统一封装（例如你们已有 `apiFetch()` 的思想）
- 统一解析 JSON envelope：`{ code, message, data, timestamp }`

### 2.3 全局 401 处理：QueryCache / MutationCache onError

TanStack Query 没有“拦截器”这个概念，但可以在 `QueryCache` / `MutationCache` 的 `onError` 里做全局处理：

- 识别 `401`
- 触发 `emitSessionExpired({ message, nextPath })`
- （可选）清理本地 query cache（避免错误数据残留）

因为 BFF 已做静默续期，客户端一般只在“真失效”（被踢/refresh 无效）才会收到 401，这时弹窗体验很好。

### 2.4 与“静默续期”协同（推荐链路）

客户端请求业务数据 `/api/*`：

1) BFF 收到请求 → 尝试带上 `admin_access_token` 转发后端  
2) 后端 401（token 过期 or 会话失效）  
3) BFF（未来可扩展到 `backendFetch`）尝试 refresh → 重放请求  
4) 若仍 401 → 返回 401 给客户端  
5) TanStack Query 全局 onError 捕获 401 → 弹出“会话失效”对话框

---

## 3. 推荐的落地步骤（以后你要做时照着走）

1) 安装依赖：
   - `@tanstack/react-query`
   - （可选）`@tanstack/react-query-devtools`

2) 增加 QueryClientProvider（挂在全局 Providers）

3) 统一“API 客户端”：
   - 只允许访问 `/api/*`
   - 统一错误类型（例如 `ApiError`）
   - 401 时只做一件事：`emitSessionExpired(...)`

4) 逐步把页面的客户端数据请求迁移到 `useQuery/useMutation`
   - 登录/登出这种建议仍走现有 BFF route（因为要写 cookie）
   - 业务 CRUD/列表/详情等完全适合 Query

---

## 4. 能不能做到“完全全局拦截所有请求”？

在浏览器环境里，除非你：

- **强制所有请求都通过同一个封装**（例如 `apiFetch` / React Query queryFn）
- 或 monkey patch `window.fetch`（不推荐）

否则无法像 Axios 的 `interceptors` 那样无侵入拦截所有请求。

因此 TanStack Query 的正确姿势是：**把数据请求入口收敛到 Query**，从而自然拥有“全局处理”能力。

