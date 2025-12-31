# Admin 文档索引

本目录聚焦 `apps/admin`（Next.js 管理后台）的架构、鉴权、交互与数据请求约定。

## 📚 推荐阅读顺序

1. [架构与部署方案](./architecture-and-deployment.md)
2. [登录与 RBAC 设计](./auth-rbac-design.md)
3. [会话踢出机制](./auth-session-kickout.md)
4. [会话过期 UI 规范](./session-expired-ui-spec.md)
5. [React Query 请求层使用规范](./react-query-request-layer.md)
6. [TanStack Query 全局错误处理](./tanstack-query-global-error-handling.md)
7. [通用 DataTable 方案](./data-table-solution.md)
8. [API 调用策略](./api-strategy.md)

## 🖼️ 架构图与流程图

SVG 统一放在 `docs/admin/assets/`，在各文档中通过相对路径引用：

- `docs/admin/assets/system-architecture.svg`
- `docs/admin/assets/auth-rbac-architecture.svg`
- `docs/admin/assets/auth-login-flow.svg`
- `docs/admin/assets/authz-rbac-flow.svg`
- `docs/admin/assets/auth-session-kickout.svg`
