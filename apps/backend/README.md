# Backend (NestJS)

该服务为 `apps/admin`（未来也包括摄影师/客户端）提供 API：**JWT 鉴权 + RBAC 权限控制**，数据存储使用自建/云 MySQL（TypeORM）。

## 本地运行

```bash
pnpm -C feat-mywork/apps/backend install
pnpm -C feat-mywork/apps/backend dev
```

默认端口：`3002`（可通过 `PORT` 覆盖）。

## 环境变量

复制并按需调整：

```bash
cp feat-mywork/apps/backend/.env.example feat-mywork/apps/backend/.env.local
```

关键变量：

- `JWT_SECRET`：JWT 签名密钥（务必修改）
- `ADMIN_ORIGIN`：CORS 允许的管理后台 Origin（默认 `http://localhost:3001`）
- `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE`：MySQL 连接配置
- `DB_SSL`：云数据库常见（可选），设置为 `true` 启用 TLS

## Docker/生产部署端口约定

- 本地开发默认监听 `3002`。
- Docker 镜像内默认监听 `3000`（`apps/backend/Dockerfile` 里设置 `PORT=3000`）。
- 生产服务器通常做端口映射：宿主机 `3002` → 容器 `3000`（例如 `-p 3002:3000`）。
- 若你的 `/opt/.../.env.production` 里包含 `PORT=3002`，会导致容器实际监听 `3002`，与 `-p 3002:3000` 冲突，从而出现健康检查一直失败（`Empty reply`/`Connection reset`）。

生成密码 hash：

```bash
pnpm -C feat-mywork/apps/backend hash:password "your-password"
```

写入/更新 RBAC 预置数据（角色、权限点、默认账号）：

```bash
pnpm -C feat-mywork/apps/backend seed:rbac
```

## API 速览

- `POST /api/v1/auth/login`（Public）：账号+密码 → `accessToken` + `refreshToken`
- `POST /api/v1/auth/refresh`（Public）：`refreshToken` → 新的 `accessToken`（并旋转 `refreshToken`）
- `POST /api/v1/auth/logout`（Public）：撤销 `refreshToken` 对应会话（accessToken 绑定 `sid`，撤销后立即失效）
- `GET /api/v1/auth/me`（JWT）：返回当前用户
- `GET /health`（Public）：健康检查
- `GET /api/v1/secure/admin-only`（JWT + role=admin）：示例受保护接口

## 容器/生产部署

本服务已读取 `PORT` 环境变量并启用 CORS；容器内默认监听 `3000`（见 `apps/backend/Dockerfile`）。
