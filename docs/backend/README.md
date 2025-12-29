# Backend（NestJS）开发说明

本仓库的后端服务位于 `apps/backend`，用于给 `apps/admin`（未来也包括摄影师端、客户端）提供 API 能力。

当前阶段目标：**后端鉴权与权限控制（JWT + RBAC）已落地，并使用 CloudBase 数据模型持久化管理员与会话**；后续再逐步接入业务数据与云存储等能力。

---

## 1. 目录结构（后端）

- `apps/backend/src/main.ts`：应用入口（CORS、全局 ValidationPipe、启动端口）
- `apps/backend/src/app.module.ts`：模块装配 + 全局 Guard（JWT/Roles/Permissions）
- `apps/backend/src/auth/*`：登录、JWT 策略、装饰器、RBAC
- `apps/backend/src/users/*`：用户仓库（CloudBase 数据模型：`admin_users`）
- `apps/backend/src/auth/sessions/*`：会话仓库（CloudBase 数据模型：`auth_sessions`，用于 refresh/logout/踢下线）
- `apps/backend/src/health/*`：健康检查

---

## 2. 本地运行（推荐）

安装依赖：

```bash
pnpm -C apps/backend install
```

准备环境变量：

```bash
cp apps/backend/.env.example apps/backend/.env.local
```

生产部署（Docker）环境变量示例：

```bash
cp apps/backend/.env.production.example /opt/1panel/apps/snapmatch/backend/.env.production
```

生成密码 Hash（bcrypt，用于写入 `admin_users.password_hash`）：

```bash
pnpm -C apps/backend hash:password "your-password"
```

`JWT_SECRET` 建议用强随机值（长度 ≥ 32），可用下面命令生成：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

启动开发模式：

```bash
pnpm -C apps/backend dev
```

默认监听 `http://localhost:3002`（可用 `PORT` 覆盖）。

端口约定（避免部署踩坑）：

- 本地开发默认 `3002`
- Docker 容器内建议固定 `3000`（与 `apps/backend/Dockerfile`/健康检查一致）
- 宿主机对外端口建议用映射（例如 `-p 3002:3000`），再由 Nginx 反代 `/api`、`/health`

---

## 3. 环境变量说明

后端会加载 `apps/backend/.env.local`（优先）与 `apps/backend/.env`。

- `PORT`：监听端口（默认 3002）
- `ADMIN_ORIGIN`：允许访问后端的 Admin 前端 Origin（CORS；默认 `http://localhost:3001`）
- `JWT_SECRET`：JWT 签名密钥
- `JWT_EXPIRES_IN`：过期时间（默认 `12h`）
- `AUTH_REFRESH_TOKEN_TTL_DAYS`：refresh token 有效期（默认 `30` 天）
- `CLOUDBASE_ENV` / `CLOUDBASE_REGION`：CloudBase 环境与地域（region 默认 `ap-shanghai`）
- `CLOUDBASE_SECRET_ID` / `CLOUDBASE_SECRET_KEY`：CloudBase 服务端密钥（用于 Node SDK 初始化）
- `CLOUDBASE_MODEL_USERS`：用户数据模型名称（默认 `rbac_users`）
- `CLOUDBASE_MODEL_AUTH_SESSIONS`：会话数据模型名称（默认 `auth_sessions`）

生产环境保护：

- `NODE_ENV=production` 时，如果 `JWT_SECRET` 过弱会拒绝启动。

---

## 4. 鉴权与登录（JWT）

### 4.1 登录

接口：`POST /auth/login`（公开接口）

请求体：

```json
{ "account": "admin", "password": "your-password" }
```

响应：

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "refreshExpiresAt": 1730000000000,
  "user": { "id": "...", "account": "...", "roles": ["admin"], "permissions": ["*"] }
}
```

### 4.2 携带 Token

除 `@Public()` 标记的接口外，全部需要携带：

```
Authorization: Bearer <accessToken>
```

### 4.3 当前用户

接口：`GET /auth/me`（需要 JWT）

### 4.4 Refresh（续期）

接口：`POST /auth/refresh`（公开接口）

```json
{ "refreshToken": "rt_..." }
```

成功返回新的 `accessToken` 与（旋转后的）`refreshToken`。

### 4.5 Logout（服务端登出/踢下线）

接口：`POST /auth/logout`（公开接口）

```json
{ "refreshToken": "rt_..." }
```

该接口会撤销对应会话；由于 `accessToken` 绑定 `sid` 且每次请求会校验会话是否有效，被撤销后会**立即失效**。

---

## 5. 权限模型（RBAC）

当前实现提供两层能力：

1. **角色（Roles）**：`admin` / `photographer` / `customer`
2. **权限（Permissions）**：字符串数组（例如 `packages:write`）

### 5.1 给接口加角色限制

```ts
@Roles(Role.Admin)
@Get("admin-only")
adminOnly() {}
```

### 5.2 给接口加权限限制

```ts
@Permissions("packages:write")
@Post("packages")
createPackage() {}
```

### 5.3 admin 超级权限

- 若用户角色包含 `admin`：自动通过 `@Roles(...)` 校验
- 若权限数组包含 `*`：自动通过 `@Permissions(...)` 校验

---

## 6. 如何新增一个受保护的业务接口

建议流程：

1. 新建 `module/controller/service`
2. DTO 使用 `class-validator`（后端已开启全局 `ValidationPipe`）
3. 用 `@Roles(...)` 或 `@Permissions(...)` 标记接口权限
4. 在 `apps/admin` 使用 `fetch/axios` 携带 Bearer Token 调用

如果你希望后续“权限点”统一管理（枚举/常量/文档化），我们可以在 `apps/backend/src/auth/permissions.ts` 增加权限字典并在 Admin 侧复用。

---

## 7. 与 Admin 的联调建议

本地推荐端口：

- Admin：`http://localhost:3001`
- Backend：`http://localhost:3002`

后端 CORS 默认只允许 `ADMIN_ORIGIN`（开发期建议设置为 `http://localhost:3001`）。

---

## 8. 常用脚本

在仓库根目录也可用：

- `pnpm dev:backend`
- `pnpm build:backend`
- `pnpm lint:backend`

或在后端目录：

```bash
pnpm -C apps/backend build
pnpm -C apps/backend lint
pnpm -C apps/backend test
```

---

## 9. CloudBase 接入规划（后续）

当前已在后端落地 CloudBase Node SDK 数据模型访问（用于管理员与会话）。后续可以按业务模块继续新增数据模型并逐步接入：

- 套系、作品、选片等业务主数据：建议统一用数据模型（便于权限、关联与后续扩展）
- 云存储：素材/作品原图、导出文件等
