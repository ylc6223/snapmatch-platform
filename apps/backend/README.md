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
- `ADMIN_ORIGIN`：CORS 允许的管理后台 Origin（默认 `http://localhost:3001`）
- `CLOUDBASE_ENV` / `CLOUDBASE_SECRET_ID` / `CLOUDBASE_SECRET_KEY`：CloudBase Node SDK 初始化所需
- `CLOUDBASE_MODEL_USERS`：用户数据模型名（默认 `rbac_users`）
- `CLOUDBASE_MODEL_AUTH_SESSIONS`：会话数据模型名（默认 `auth_sessions`）

## Docker/生产部署端口约定

- 本地开发默认监听 `3002`。
- Docker 镜像内默认监听 `3000`（`apps/backend/Dockerfile` 里设置 `PORT=3000`）。
- 生产服务器通常做端口映射：宿主机 `3002` → 容器 `3000`（例如 `-p 3002:3000`）。
- 若你的 `/opt/.../.env.production` 里包含 `PORT=3002`，会导致容器实际监听 `3002`，与 `-p 3002:3000` 冲突，从而出现健康检查一直失败（`Empty reply`/`Connection reset`）。

生成密码 hash：

```bash
pnpm -C apps/backend hash:password "your-password"
```

## API 速览

- `POST /auth/login`（Public）：账号+密码 → `accessToken` + `refreshToken`
- `POST /auth/refresh`（Public）：`refreshToken` → 新的 `accessToken`（并旋转 `refreshToken`）
- `POST /auth/logout`（Public）：撤销 `refreshToken` 对应会话（accessToken 绑定 `sid`，撤销后立即失效）
- `GET /auth/me`（JWT）：返回当前用户
- `GET /health`（Public）：健康检查
- `GET /secure/admin-only`（JWT + role=admin）：示例受保护接口

## CloudBase 部署（建议 CloudRun 容器模式）

本服务已读取 `PORT` 环境变量并启用 CORS；可直接用于 CloudBase CloudRun 容器部署（参考仓库 `rules/cloudrun-development/rule.md`）。
