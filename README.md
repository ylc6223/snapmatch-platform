# SnapMatch Platform (Monorepo)

本仓库用于承载「一拍即合 / SnapMatch」的 **官网（Web）** 与 **管理后台（Admin）**，采用 Monorepo 目录结构，便于统一管理与未来扩展。

## 目录结构

- `apps/web`：摄影工作室官网（Next.js）
- `apps/admin`：管理后台（Next.js）
- `packages/*`：预留给共享组件/工具库

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

