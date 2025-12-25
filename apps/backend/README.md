# Backend (NestJS)

该服务为 `apps/admin`（未来也包括摄影师/客户端）提供 API：**JWT 鉴权 + RBAC 权限控制**，并预留 CloudBase 持久化接入点。

## 本地运行

```bash
pnpm -C apps/backend install
pnpm -C apps/backend dev
```

默认端口：`3002`（可通过 `PORT` 覆盖）。

## 环境变量

复制并按需调整：

```bash
cp apps/backend/.env.example apps/backend/.env.local
```

关键变量：

- `JWT_SECRET`：JWT 签名密钥（务必修改）
- `ADMIN_ACCOUNT` / `ADMIN_PASSWORD_HASH`：本地内置管理员账号（仅用于启动期）
- `ADMIN_ORIGIN`：CORS 允许的管理后台 Origin（默认 `http://localhost:3001`）

生成密码 hash：

```bash
pnpm -C apps/backend hash:password "your-password"
```

## API 速览

- `POST /auth/login`（Public）：账号+密码 → `accessToken`
- `GET /auth/me`（JWT）：返回当前用户
- `GET /health`（Public）：健康检查
- `GET /secure/admin-only`（JWT + role=admin）：示例受保护接口

## CloudBase 部署（建议 CloudRun 容器模式）

本服务已读取 `PORT` 环境变量并启用 CORS；可直接用于 CloudBase CloudRun 容器部署（参考仓库 `rules/cloudrun-development/rule.md`）。
