# Admin：React Query 请求层使用规范（apiFetch + BFF）

本文描述 `apps/admin` 当前“请求层封装”的最佳实践用法：在 **Client Components** 中统一使用
`@tanstack/react-query` 管理数据获取与写入，并通过 `apiFetch()` 收敛浏览器侧的请求与错误处理。

适用范围：`apps/admin` 的 **浏览器端**（`"use client"`）业务数据请求。

不适用范围：Next.js **服务端**（Server Components / Route Handlers / `proxy.ts`）内部的请求转发逻辑。

---

## 1. 总体架构与约束

### 1.1 数据流（推荐固定）

浏览器（Client Component）只请求同源 BFF：

- `GET/POST/PATCH/DELETE /admin/api/*`（Next.js Route Handlers）
- 由 BFF 转发到后端：
  - `apps/backend` 的 `/api/v1/*`

核心收益：

- accessToken 存在 HttpOnly Cookie，浏览器 JS 不可读，安全边界清晰
- 续期/踢下线/错误收敛都能在 BFF 与统一请求封装里完成

### 1.2 强约束（必须遵守）

- Client Components **不要直接 `fetch(BACKEND_BASE_URL)`**，只请求 `withAdminBasePath("/api/...")`
- Client Components **不要直接 `fetch(...)`**，优先使用：
  - `useQuery` / `useMutation` + `apiFetch`
- 仅在“非 JSON / 流式 / 下载”等特殊场景才允许直写 `fetch`（并补齐错误处理）

---

## 2. 关键实现位置（当前代码）

### 2.1 QueryClientProvider（全局）

`apps/admin/components/providers.tsx` 负责：

- 创建 `QueryClient`
- `QueryClientProvider` 包裹全站
- 设定默认策略（`staleTime`、`retry`、`refetchOnWindowFocus` 等）

### 2.2 统一 fetcher：apiFetch（客户端）

`apps/admin/lib/api/client.ts` 提供：

- `apiFetch<T>(url, init)`：底层使用原生 `fetch`
- 401 时触发 `emitSessionExpired(...)`（全局会话失效对话框）
- 非 2xx 抛出 `ApiError`（携带 `status` 与 `payload`）
- `getApiErrorMessage(error, fallback)`：从后端 envelope 提取用户可读错误信息

---

## 3. 推荐用法：useQuery（读）

### 3.1 基本模式（最常用）

要点：

- `queryKey` 必须稳定且包含所有影响结果的参数（`q/page/pageSize/sort/filters`）
- `queryFn` 里用 `apiFetch`，并返回 **解包后的 data**（不要把 `ApiResponse` 传到 UI 层）

示例（列表查询）：

- queryKey：`["users", "list", { q, page, pageSize }]`
- url：`/api/users?q=...&page=...`

### 3.2 表格/分页：keepPreviousData

分页场景建议用 `placeholderData: keepPreviousData`，避免翻页时 UI 抖动（先保留旧数据再刷新）。

### 3.3 手动刷新

按钮触发刷新时：

- 优先用 `query.refetch()`
- 或用 `queryClient.invalidateQueries({ queryKey: [...] })` 触发失效刷新

---

## 4. 推荐用法：useMutation（写）

### 4.1 基本模式

要点：

- `mutationFn` 只做一次请求（`apiFetch`）
- 成功后通过 `invalidateQueries` 让相关列表自动刷新
- 失败时使用 `getApiErrorMessage` 做统一 toast/提示

### 4.2 失效策略建议

列表 + 编辑弹窗的常用策略：

- `onSuccess`：
  - 关闭弹窗
  - `invalidateQueries({ queryKey: ["resource", "list"] })`
- 如存在详情页缓存：
  - 同时失效 `["resource", "detail", id]`

---

## 5. 错误处理与会话失效

### 5.1 401（未登录/会话过期）

`apiFetch` 在收到 `401` 时会触发全局会话失效事件，UI 会弹出会话失效对话框并引导重新登录。

注意：

- BFF 本身已尽量做“静默续期（refresh）”，客户端一般只在真正失效时才看到 401

### 5.2 统一错误文案

建议业务层永远用：

- `getApiErrorMessage(error, "xxx失败")`

原因：

- 后端返回统一 envelope：`{ code, message, errors?, timestamp }`
- 错误展示可以复用 `message + errors[].reason`，减少每处重复解析

---

## 6. 服务端请求不迁移（为什么）

React Query 是“客户端数据层”，不适合用于：

- Route Handlers（`apps/admin/app/api/*`）：这里要转发后端、写 HttpOnly Cookie
- `proxy.ts`：这里是 SSR 入口的登录态保护与静默续期
- Server Components：这里的 `fetch` 可能涉及 Next.js 缓存语义与 SSR 数据获取

因此本项目的原则是：

- **服务端**：继续使用原生 `fetch` / `backendFetch` 做转发与鉴权
- **客户端**：统一使用 React Query + `apiFetch`

---

## 7. 新增一个业务请求的落地步骤（Checklist）

1. 确认后端已有对应 `/api/v1/*` 能力，或已通过 BFF 代理到 `/api/*`
2. 在 Client Component 内：
   - 列表：`useQuery({ queryKey, queryFn })`
   - 写入：`useMutation({ mutationFn, onSuccess: invalidate })`
3. 请求必须使用 `withAdminBasePath("/api/...")` 构建 URL
4. 错误提示使用 `getApiErrorMessage`
5. 表格分页使用 `keepPreviousData`（如适用）
