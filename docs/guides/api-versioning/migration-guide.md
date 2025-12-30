# API 版本化迁移方案 - Backend 添加 `/api/v1` 前缀

> **迁移目标**: 将 Backend API 从无前缀改造为版本化路径 (`/api/v1/*`)
> **创建时间**: 2025-12-31
> **迁移类型**: 破坏性变更（需要协调修改多处代码）

---

## 📋 执行摘要

### 当前架构

```
客户端 → /api/auth/login
  ↓
Nginx → Admin:3001 (/api/*)
  ↓
Admin Route Handler → Backend:3002 (/auth/login)  ← 无前缀
```

### 目标架构

```
客户端 → /api/auth/login
  ↓
Nginx → Admin:3001 (/api/*)
  ↓
Admin Route Handler → Backend:3002 (/api/v1/auth/login)  ← 有版本前缀
```

### 核心变更

1. ✅ **Backend 添加全局前缀**: `app.setGlobalPrefix('api/v1')`
2. ⚠️ **Admin 修改所有硬编码路径**: 9 个文件需要修改
3. ⚠️ **Nginx 配置调整**: 健康检查路径需要决策
4. ✅ **客户端代码无需修改**: 继续调用 `/api/*`

---

## ⚠️ 破坏性影响分析

### 🔴 **高影响（必须修改）**

#### 1. Backend API 路径完全变更

**影响范围**: 所有直接调用 Backend 的服务端代码

| 组件         | 当前路径             | 迁移后路径                  | 影响等级  |
| ------------ | -------------------- | --------------------------- | --------- |
| 登录接口     | `POST /auth/login`   | `POST /api/v1/auth/login`   | 🔴 破坏性 |
| 刷新 Token   | `POST /auth/refresh` | `POST /api/v1/auth/refresh` | 🔴 破坏性 |
| 获取用户信息 | `GET /auth/me`       | `GET /api/v1/auth/me`       | 🔴 破坏性 |
| 登出接口     | `POST /auth/logout`  | `POST /api/v1/auth/logout`  | 🔴 破坏性 |
| 用户管理     | `GET /users`         | `GET /api/v1/users`         | 🔴 破坏性 |
| 健康检查     | `GET /health`        | `GET /api/v1/health`        | 🟡 待定   |

**影响原因**:

- Admin 的 9 个文件硬编码了 Backend 路径
- 所有 `new URL("/auth/xxx", backendBaseUrl)` 的调用都会失败
- 如果不修改，所有 API 调用将返回 404

---

#### 2. Admin Route Handlers 路径映射逻辑失效

**影响文件**: `apps/admin/app/api/[...path]/route.ts`

**当前逻辑**:

```typescript
// Line 72
const backendPath = pathname.startsWith('/api/')
  ? pathname.slice('/api'.length) // 移除 "/api" 前缀
  : pathname;
// 结果: /api/auth/login → /auth/login
```

**问题**:

- 当前逻辑将 `/api/auth/login` 转换为 `/auth/login`
- Backend 改为 `/api/v1` 后，需要转换为 `/api/v1/auth/login`
- **如果不修改，所有代理请求都会 404**

**必须修改为**:

```typescript
const backendPath = pathname.startsWith('/api/')
  ? `/api/v1${pathname.slice('/api'.length)}` // 替换为 /api/v1
  : pathname;
// 结果: /api/auth/login → /api/v1/auth/login
```

---

### 🟡 **中等影响（需要决策）**

#### 3. 健康检查端点路径选择

**当前配置** (`scripts/server-setup.sh:302`):

```nginx
location /health {
    proxy_pass http://localhost:3002/health;  # 直连 Backend
}
```

**决策点**: 健康检查是否需要版本化？

| 方案                     | 路径             | 优点           | 缺点                 |
| ------------------------ | ---------------- | -------------- | -------------------- |
| **方案 A**: 保持无前缀   | `/health`        | 简洁、符合约定 | Backend 需要特殊处理 |
| **方案 B**: 加入版本前缀 | `/api/v1/health` | 统一路径风格   | 健康检查不应该有版本 |
| **方案 C**: 独立路径     | `/_health`       | 独立于 API     | 新增路径             |

**推荐**: 方案 A（保持 `/health`），Backend 使用 `@Public()` 装饰器单独排除

**实现方式**:

```typescript
// apps/backend/src/health/health.controller.ts
@Controller('health') // 不受 globalPrefix 影响
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

**Nginx 配置保持不变**:

```nginx
location /health {
    proxy_pass http://localhost:3002/health;
}
```

---

### 🟢 **低影响（无需修改）**

#### 4. 客户端代码（浏览器 JS）

**影响范围**: 所有前端调用

**原因**: 客户端只调用 Admin 的 `/api/*`，不直接调用 Backend

**示例**:

```typescript
// apps/admin/app/(guest)/login/login-form.tsx:33
await fetch("/api/auth/login", { ... });  // ✅ 无需修改
```

**验证**: 客户端 → Admin BFF → Backend，路径转换由 Admin 处理

---

#### 5. 环境变量

**影响**: 无需新增环境变量

**现有变量**:

- `BACKEND_BASE_URL`: 继续使用 `http://localhost:3002`
- `ADMIN_ORIGIN`: 不受影响

**可选扩展**: 如果未来需要动态配置版本，可以添加:

```bash
# apps/backend/.env (可选)
API_PREFIX=api/v1
```

---

## 📝 需要修改的文件清单

### Backend（1 个文件）

#### 1. `apps/backend/src/main.ts`

**修改位置**: Line 13（在创建应用后）

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // ✅ 新增：设置全局 API 前缀
  app.setGlobalPrefix('api/v1');

  // ... 其他配置
}
```

**影响**: 所有 Controller 的路径都会添加 `/api/v1` 前缀

---

### Admin（9 个文件）

#### 2. `apps/admin/app/api/[...path]/route.ts`

**修改内容**: 2 处

##### 修改 1: refreshSession 函数（Line 22）

```typescript
// ❌ 当前
const response = await fetch(new URL("/auth/refresh", backendBaseUrl), {

// ✅ 修改为
const response = await fetch(new URL("/api/v1/auth/refresh", backendBaseUrl), {
```

##### 修改 2: proxyToBackend 函数（Line 72）

```typescript
// ❌ 当前
const backendPath = pathname.startsWith('/api/') ? pathname.slice('/api'.length) : pathname;

// ✅ 修改为
const backendPath = pathname.startsWith('/api/')
  ? `/api/v1${pathname.slice('/api'.length)}`
  : pathname;
```

---

#### 3. `apps/admin/app/api/auth/login/route.ts`

**修改位置**: Line 62

```typescript
// ❌ 当前
const result = await backendFetch<...>(
  "/auth/login",
  { ... }
);

// ✅ 修改为
const result = await backendFetch<...>(
  "/api/v1/auth/login",
  { ... }
);
```

**同时更新注释** (Line 20):

```typescript
// ❌ 当前
// * - POST `${BACKEND_BASE_URL}/auth/login`

// ✅ 修改为
// * - POST `${BACKEND_BASE_URL}/api/v1/auth/login`
```

---

#### 4. `apps/admin/app/api/auth/me/route.ts`

**修改内容**: 3 处

##### 修改 1: refreshSession 函数（Line 22）

```typescript
// ❌ 当前
const response = await fetch(new URL("/auth/refresh", backendBaseUrl), {

// ✅ 修改为
const response = await fetch(new URL("/api/v1/auth/refresh", backendBaseUrl), {
```

##### 修改 2: GET 处理函数（Line 49）

```typescript
// ❌ 当前
const response = await fetch(new URL("/auth/me", backendBaseUrl), {

// ✅ 修改为
const response = await fetch(new URL("/api/v1/auth/me", backendBaseUrl), {
```

##### 修改 3: backendFetch 调用（Line 75）

```typescript
// ❌ 当前
const result = await backendFetch<...>("/auth/me");

// ✅ 修改为
const result = await backendFetch<...>("/api/v1/auth/me");
```

**同时更新注释** (Line 65):

```typescript
// ❌ 当前
// * - GET `${BACKEND_BASE_URL}/auth/me`

// ✅ 修改为
// * - GET `${BACKEND_BASE_URL}/api/v1/auth/me`
```

---

#### 5. `apps/admin/app/api/auth/logout/route.ts`

**修改位置**: Line 17

```typescript
// ❌ 当前
await backendFetch("/auth/logout", {

// ✅ 修改为
await backendFetch("/api/v1/auth/logout", {
```

---

#### 6. `apps/admin/proxy.ts`

**修改内容**: 2 处

##### 修改 1: requireAuth 函数（Line 57）

```typescript
// ❌ 当前
const response = await fetch(new URL("/auth/me", backendBaseUrl), {

// ✅ 修改为
const response = await fetch(new URL("/api/v1/auth/me", backendBaseUrl), {
```

##### 修改 2: refreshAndSetCookie 函数（Line 70）

```typescript
// ❌ 当前
const response = await fetch(new URL("/auth/refresh", backendBaseUrl), {

// ✅ 修改为
const response = await fetch(new URL("/api/v1/auth/refresh", backendBaseUrl), {
```

---

#### 7. `apps/admin/app/dashboard/layout.tsx`

**修改位置**: Line 78

```typescript
// ❌ 当前
new URL("/auth/me", process.env.BACKEND_BASE_URL ?? "http://localhost:3002"),

// ✅ 修改为
new URL("/api/v1/auth/me", process.env.BACKEND_BASE_URL ?? "http://localhost:3002"),
```

---

### Nginx 配置（无需修改）

#### 8. `scripts/server-setup.sh`

**健康检查配置** (Line 302):

```nginx
location /health {
    proxy_pass http://localhost:3002/health;  # ✅ 保持不变
}
```

**API 代理配置** (Line 278):

```nginx
location /api/ {
    proxy_pass http://localhost:3001;  # ✅ 保持不变（代理到 Admin）
}
```

---

## 🧪 测试验证清单

### 本地开发环境测试

#### 阶段 1: Backend 单独测试

- [ ] Backend 启动成功 (`pnpm dev:backend`)
- [ ] 访问 `http://localhost:3002/api/v1/health` 返回正常（如果健康检查也加前缀）
- [ ] 访问 `http://localhost:3002/health` 返回正常（如果健康检查保持无前缀）
- [ ] 访问旧路径 `http://localhost:3002/auth/login` 返回 404

#### 阶段 2: Admin + Backend 集成测试

- [ ] 同时启动 Admin 和 Backend (`pnpm dev`)
- [ ] Admin 启动日志无报错
- [ ] 访问 `http://localhost:3001/admin/login` 页面正常显示

#### 阶段 3: 功能测试

- [ ] **登录功能**: 使用正确账号密码可以登录成功
- [ ] **Token 刷新**: 等待 accessToken 过期后，自动刷新成功
- [ ] **用户信息**: 登录后访问 `/admin/dashboard` 显示用户信息
- [ ] **登出功能**: 点击登出后清除 session，重定向到登录页
- [ ] **权限检查**: RBAC 权限校验正常工作
- [ ] **401 处理**: accessToken 失效时弹出会话过期提示

#### 阶段 4: 错误场景测试

- [ ] Backend 未启动时，Admin 显示 "Bad Gateway" 错误
- [ ] 使用错误密码登录，显示 "账号或密码错误"
- [ ] 网络超时时，正确显示错误提示

---

### 生产环境部署测试

#### 部署前检查

- [ ] 所有代码修改已提交到 Git
- [ ] `.env` 文件已更新（如果有新增环境变量）
- [ ] CI/CD 流程测试通过
- [ ] Docker 镜像构建成功

#### 部署后验证

- [ ] Nginx 配置生效 (`sudo nginx -t && sudo systemctl reload nginx`)
- [ ] Backend 健康检查正常 (`curl https://yourdomain.com/health`)
- [ ] Admin 页面访问正常
- [ ] 登录流程完整可用
- [ ] API 调用返回正确的响应格式

---

## 🚀 迁移执行步骤

### 第 1 步: 代码修改（开发环境）

```bash
# 1. 切换到新分支
git checkout -b feature/api-versioning

# 2. 修改 Backend（1 个文件）
# 编辑 apps/backend/src/main.ts

# 3. 修改 Admin（9 个文件）
# 按照上述清单逐个修改

# 4. 提交代码
git add .
git commit -m "feat: add API versioning with /api/v1 prefix"
```

---

### 第 2 步: 本地测试

```bash
# 1. 安装依赖（如果有新增）
pnpm install

# 2. 启动 Backend
pnpm dev:backend

# 3. 验证新路径
curl http://localhost:3002/api/v1/health  # 或 /health

# 4. 启动 Admin
pnpm dev:admin

# 5. 浏览器测试
# 访问 http://localhost:3001/admin/login
# 执行完整的登录、刷新、登出流程
```

---

### 第 3 步: 代码审查

- [ ] PR 提交到 GitHub
- [ ] CI/CD 质量检查通过（Lint + TypeScript + 测试）
- [ ] Code Review 完成
- [ ] 至少 1 人审批

---

### 第 4 步: 部署到生产环境

```bash
# 1. 合并到主分支
git checkout main
git merge feature/api-versioning

# 2. 打版本标签
git tag v1.1.0
git push origin v1.1.0

# 3. 触发 CI/CD 自动部署
# GitHub Actions 会自动构建和部署

# 4. 部署后验证（重要！）
curl https://yourdomain.com/health
curl https://yourdomain.com/api/auth/me  # 应该返回 401（未登录）
```

---

### 第 5 步: 监控与回滚准备

#### 监控指标

- [ ] 错误日志监控（Admin + Backend）
- [ ] API 响应时间
- [ ] 用户登录成功率
- [ ] 会话刷新成功率

#### 回滚方案

```bash
# 如果发现问题，立即回滚到上一个版本
git revert v1.1.0
git push origin main

# 或者直接回滚 Nginx/容器配置
docker rollback snapmatch-backend
```

---

## ⚡ 优化建议（可选）

### 1. 使用环境变量控制 API 前缀

**目的**: 提高灵活性，支持不同环境使用不同前缀

**实现**:

```typescript
// apps/backend/src/main.ts
const apiPrefix = config.get<string>('API_PREFIX') ?? 'api/v1';
app.setGlobalPrefix(apiPrefix);
```

**环境变量**:

```bash
# .env
API_PREFIX=api/v1
```

---

### 2. Swagger 文档配置

**目的**: 确保 Swagger UI 显示正确的 API 路径

**实现**:

```typescript
// apps/backend/src/main.ts (如果未来添加 Swagger)
const config = new DocumentBuilder()
  .setTitle('SnapMatch API')
  .setVersion('1.0')
  .addServer('/api/v1') // ✅ 指定 API 前缀
  .build();
```

---

### 3. API 版本共存（未来扩展）

**场景**: 当需要 v2 API 时

**实现**:

```typescript
// 方案 A: 多个 globalPrefix（不推荐）
// 方案 B: 使用 @Controller 显式指定版本
@Controller('api/v2/auth')
export class AuthV2Controller { ... }
```

---

## 📊 风险评估

| 风险项               | 严重性 | 可能性 | 影响           | 缓解措施               |
| -------------------- | ------ | ------ | -------------- | ---------------------- |
| 遗漏修改文件导致 404 | 🔴 高  | 🟡 中  | 用户无法登录   | 完整测试 + Code Review |
| 路径映射逻辑错误     | 🔴 高  | 🟡 中  | API 调用失败   | 单元测试 + 集成测试    |
| 生产环境配置错误     | 🔴 高  | 🟢 低  | 服务不可用     | 灰度发布 + 快速回滚    |
| 健康检查失效         | 🟡 中  | 🟢 低  | 监控告警       | 保持 `/health` 路径    |
| 客户端缓存问题       | 🟢 低  | 🟡 中  | 部分用户需刷新 | 强制刷新提示           |

---

## ✅ 成功标准

### 功能标准

- [x] 所有 API 路径包含 `/api/v1` 前缀
- [x] 登录、刷新、登出功能正常
- [x] RBAC 权限校验正常
- [x] 健康检查端点可访问
- [x] 错误处理和响应格式一致

### 性能标准

- [x] API 响应时间无明显增加
- [x] 无新增错误日志
- [x] 用户体验无感知

### 文档标准

- [x] README 更新 API 路径示例
- [x] Swagger 文档（如有）显示正确路径
- [x] 迁移文档完整归档

---

## 🔗 相关资源

- **项目结构文档**: [docs/architecture/overview.md](../../architecture/overview.md)
- **Backend 开发文档**: [docs/backend/README.md](./backend/README.md)
- **Admin 架构文档**: [docs/admin/architecture-and-deployment.md](./admin/architecture-and-deployment.md)
- **部署文档**: [docs/deployment/overview.md](./deployment/overview.md)
- **NestJS 全局前缀文档**: https://docs.nestjs.com/faq/global-prefix

---

## 📌 附录

### A. 所有硬编码路径汇总

| 文件                                      | 行号 | 当前路径                        | 修改后路径             |
| ----------------------------------------- | ---- | ------------------------------- | ---------------------- |
| `apps/admin/app/api/[...path]/route.ts`   | 22   | `/auth/refresh`                 | `/api/v1/auth/refresh` |
| `apps/admin/app/api/[...path]/route.ts`   | 72   | `pathname.slice("/api".length)` | `/api/v1${...}`        |
| `apps/admin/app/api/auth/login/route.ts`  | 62   | `/auth/login`                   | `/api/v1/auth/login`   |
| `apps/admin/app/api/auth/me/route.ts`     | 22   | `/auth/refresh`                 | `/api/v1/auth/refresh` |
| `apps/admin/app/api/auth/me/route.ts`     | 49   | `/auth/me`                      | `/api/v1/auth/me`      |
| `apps/admin/app/api/auth/me/route.ts`     | 75   | `/auth/me`                      | `/api/v1/auth/me`      |
| `apps/admin/app/api/auth/logout/route.ts` | 17   | `/auth/logout`                  | `/api/v1/auth/logout`  |
| `apps/admin/proxy.ts`                     | 57   | `/auth/me`                      | `/api/v1/auth/me`      |
| `apps/admin/proxy.ts`                     | 70   | `/auth/refresh`                 | `/api/v1/auth/refresh` |
| `apps/admin/app/dashboard/layout.tsx`     | 78   | `/auth/me`                      | `/api/v1/auth/me`      |

**总计**: 10 处硬编码路径需要修改

---

### B. 环境变量对照表

| 变量名             | 当前值                  | 迁移后           | 说明                 |
| ------------------ | ----------------------- | ---------------- | -------------------- |
| `BACKEND_BASE_URL` | `http://localhost:3002` | 不变             | Backend 基础 URL     |
| `ADMIN_ORIGIN`     | `http://localhost:3001` | 不变             | Admin 来源           |
| `PORT`             | `3002`                  | 不变             | Backend 端口         |
| `API_PREFIX`       | 无                      | `api/v1`（可选） | API 前缀（可选扩展） |

---

## 📝 维护说明

本文档应在以下情况更新：

- ✅ 迁移完成后更新状态
- ✅ 发现新的受影响文件
- ✅ 修改实施步骤
- ✅ 添加新的测试用例
- ✅ 记录遇到的问题和解决方案

**最后更新**: 2025-12-31
**文档作者**: SnapMatch Platform Team
**审核状态**: 待审核
