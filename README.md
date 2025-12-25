# SnapMatch Platform (Monorepo)

本仓库用于承载「一拍即合 / SnapMatch」的 **官网（Web）** 与 **管理后台（Admin）**，采用 Monorepo 目录结构，便于统一管理与未来扩展。

## 目录结构

- `apps/web`：摄影工作室官网（Next.js）
- `apps/admin`：管理后台（Next.js）
- `apps/backend`：后台 API（NestJS，JWT + 权限控制）
- `packages/*`：预留给共享组件/工具库
- `docs/deployment.md`：部署指南
- `docs/admin-api-strategy.md`：后台 API/数据流方案
- `docs/backend.md`：后端（NestJS）开发说明

## 本地开发

> 推荐使用 `pnpm`。

```bash
pnpm -C apps/web dev
pnpm -C apps/admin dev
```

也可以在仓库根目录运行：

```bash
pnpm dev
```

## Web → Admin 跳转配置

`apps/web` 的「管理员登录」按钮默认在本地跳转到 `http://localhost:3001/login`，线上默认跳转到 `/admin/login`。如需自定义（例如线上使用独立域名），设置：

```bash
NEXT_PUBLIC_ADMIN_BASE_URL="https://admin.example.com"
```
