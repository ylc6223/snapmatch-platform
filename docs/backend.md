# Backend（NestJS）开发说明

本仓库的后端服务位于 `apps/backend`，用于给 `apps/admin`（未来也包括摄影师端、客户端）提供 API 能力。

当前阶段目标：**把后台鉴权与权限控制框架先搭起来**，后续再逐步接入 CloudBase 数据库/存储等能力。

---

## 1. 目录结构（后端）

- `apps/backend/src/main.ts`：应用入口（CORS、全局 ValidationPipe、启动端口）
- `apps/backend/src/app.module.ts`：模块装配 + 全局 Guard（JWT/Roles/Permissions）
- `apps/backend/src/auth/*`：登录、JWT 策略、装饰器、RBAC
- `apps/backend/src/users/*`：用户仓库（当前内存实现，预留 CloudBase 实现）
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

生成管理员密码 Hash（bcrypt）：

```bash
pnpm -C apps/backend hash:password "your-password"
```

将输出填入 `apps/backend/.env.local`：

```bash
ADMIN_ACCOUNT=admin
ADMIN_PASSWORD_HASH=...上一步输出...
JWT_SECRET=...强随机字符串...
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

---

## 3. 环境变量说明

后端会加载 `apps/backend/.env.local`（优先）与 `apps/backend/.env`。

- `PORT`：监听端口（默认 3002）
- `ADMIN_ORIGIN`：允许访问后端的 Admin 前端 Origin（CORS；默认 `http://localhost:3001`）
- `JWT_SECRET`：JWT 签名密钥
- `JWT_EXPIRES_IN`：过期时间（默认 `12h`）
- `USERS_REPOSITORY`：用户仓库实现（`memory` | `cloudbase`，当前默认 `memory`）
- `ADMIN_ACCOUNT` / `ADMIN_PASSWORD_HASH`：内置管理员账号（仅启动期用于登录打通）

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
{ "accessToken": "...", "user": { "id": "...", "account": "...", "roles": ["admin"], "permissions": ["*"] } }
```

### 4.2 携带 Token

除 `@Public()` 标记的接口外，全部需要携带：

```
Authorization: Bearer <accessToken>
```

### 4.3 当前用户

接口：`GET /auth/me`（需要 JWT）

---

## 5. 权限模型（RBAC）

当前实现提供两层能力：

1) **角色（Roles）**：`admin` / `photographer` / `customer`
2) **权限（Permissions）**：字符串数组（例如 `packages:write`）

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

1) 新建 `module/controller/service`
2) DTO 使用 `class-validator`（后端已开启全局 `ValidationPipe`）
3) 用 `@Roles(...)` 或 `@Permissions(...)` 标记接口权限
4) 在 `apps/admin` 使用 `fetch/axios` 携带 Bearer Token 调用

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

当前 `USERS_REPOSITORY=cloudbase` 仅为占位（会抛错），目的是让后端结构上能平滑切换到 CloudBase：

- 用户：未来可从 CloudBase Auth / 自建用户表读取
- 数据：套系、作品、选片等业务数据写入 CloudBase（NoSQL 或 MySQL）

当你确定 CloudBase 的“用户体系”（仅管理员？摄影师/客户是否走同一 Auth Provider？）之后，我可以把 `CloudBaseUsersRepository` 和业务模型一起落地。
