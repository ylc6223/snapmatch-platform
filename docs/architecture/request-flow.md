# 请求链路完整分析 - Admin 到 Backend 的 API 调用流程

> **文档目的**: 深入解析从浏览器到 Backend 的完整请求链路
> **创建时间**: 2025-12-31
> **适用场景**: 理解当前架构、调试问题、规划改造

---

## 🎯 核心问题

**为什么客户端调用 `/api/auth/login`，但 Backend 收到的是 `/auth/login`？**

答案：**Admin 作为 BFF（Backend For Frontend）层，剥离了 `/api` 前缀**

---

## 📊 完整请求链路图

### 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         浏览器（客户端）                             │
│                                                                     │
│  用户操作: 输入账号密码 → 点击登录                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ① 发起 AJAX 请求
                               │ POST /api/auth/login
                               │ Host: localhost:3001
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Admin (Next.js App) - 端口 3001                  │
│                                                                     │
│  Next.js 文件系统路由:                                              │
│  app/api/auth/login/route.ts  ← 匹配到这个 Route Handler           │
│                                                                     │
│  ② 服务端执行:                                                      │
│     - 读取请求 body (account, password)                            │
│     - 调用 backendFetch("/auth/login", {...})                      │
│     - 构造 URL: new URL("/auth/login", "http://localhost:3002")   │
│     - 结果: http://localhost:3002/auth/login                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ③ 转发请求到 Backend
                               │ POST /auth/login
                               │ Host: localhost:3002
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend (NestJS API) - 端口 3002                  │
│                                                                     │
│  NestJS 路由系统:                                                   │
│  @Controller("auth")        ← 基础路径: /auth                       │
│  @Post("login")             ← 方法路径: /login                      │
│  完整路径: /auth/login                                              │
│                                                                     │
│  ④ 业务逻辑:                                                        │
│     - 验证账号密码                                                  │
│     - 签发 JWT accessToken                                         │
│     - 返回 { accessToken, refreshToken, user }                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ⑤ 返回响应
                               │ 200 OK { data: { accessToken, ... } }
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Admin (Next.js App) - 端口 3001                  │
│                                                                     │
│  ⑥ 后处理:                                                          │
│     - 接收 Backend 响应                                             │
│     - 提取 accessToken 和 refreshToken                              │
│     - 写入 HttpOnly Cookie (setAdminAccessToken)                   │
│     - 返回用户信息给浏览器（不包含 token）                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ ⑦ 返回给浏览器
                               │ 200 OK { data: { user } }
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         浏览器（客户端）                             │
│                                                                     │
│  ⑧ 接收响应:                                                        │
│     - 登录成功                                                      │
│     - Cookie 自动保存（HttpOnly，JS 不可读）                        │
│     - 跳转到 /admin/dashboard                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 逐步代码分析

### 第 1 步：浏览器发起请求

**文件**: `apps/admin/app/(guest)/login/login-form.tsx`

```typescript
// Line 33
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({ account: account.trim(), password: password.trim() }),
});
```

**关键点**:

- ✅ 使用**相对路径** `/api/auth/login`
- ✅ 在浏览器中被解析为 `http://localhost:3001/api/auth/login`（同源）
- ✅ 避免了 CORS 问题（不跨域）

**实际请求**:

```http
POST http://localhost:3001/api/auth/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{"account":"admin","password":"password123"}
```

---

### 第 2 步：Next.js 路由匹配

**Next.js 文件系统路由规则**:

```
apps/admin/app/api/
├── auth/
│   ├── login/
│   │   └── route.ts       ← 匹配 /api/auth/login
│   ├── logout/
│   │   └── route.ts       ← 匹配 /api/auth/logout
│   └── me/
│       └── route.ts       ← 匹配 /api/auth/me
└── [...path]/
    └── route.ts           ← 捕获所有其他 /api/* 请求
```

**路由优先级**:

1. **精确匹配** (`auth/login/route.ts`) > **动态路由** (`[...path]/route.ts`)
2. `/api/auth/login` 被路由到 `app/api/auth/login/route.ts`

---

### 第 3 步：Admin Route Handler 处理

**文件**: `apps/admin/app/api/auth/login/route.ts`

```typescript
// Line 28-30
export async function POST(request: Request) {
  // 1) 读取请求体
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    // 错误处理...
  }

  // 2) 验证参数
  const parsed = LoginSchema.safeParse(input);
  // ...

  // 3) 调用 Backend（关键！）
  const result = await backendFetch<
    ApiResponse<{ accessToken: string; refreshToken?: string; user: AuthUser }>
  >(
    '/auth/login', // ← 注意：这里是 /auth/login，不是 /api/auth/login
    {
      method: 'POST',
      auth: false, // 登录接口不需要先有 token
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
    },
  );

  // 4) 处理响应
  const accessToken = result.data?.accessToken;
  const refreshToken = result.data?.refreshToken;
  const user = result.data?.user;

  // 5) 写入 HttpOnly Cookie
  const response = NextResponse.json({ code: 200, data: { user } });
  setAdminAccessToken(response, accessToken);
  if (refreshToken) setAdminRefreshToken(response, refreshToken);
  return response;
}
```

**关键点**:

- ✅ 接收浏览器的 `/api/auth/login` 请求
- ✅ 调用 `backendFetch("/auth/login", ...)` - **移除了 `/api` 前缀**
- ✅ 写入 HttpOnly Cookie（浏览器 JS 不可读，安全）
- ✅ 只返回用户信息给浏览器（不暴露 token）

---

### 第 4 步：backendFetch 构造 Backend URL

**文件**: `apps/admin/lib/api/backend.ts`

```typescript
// Line 25-28
function getBackendBaseUrl() {
  // 读取环境变量 BACKEND_BASE_URL
  return process.env.BACKEND_BASE_URL ?? 'http://localhost:3002';
}

// Line 46-52
export async function backendFetch<T>(
  path: string, // 传入的是 "/auth/login"
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const backendBaseUrl = getBackendBaseUrl(); // "http://localhost:3002"

  // 🔑 核心：使用 new URL() 拼接完整 URL
  const url = new URL(path, backendBaseUrl);
  // 结果: new URL("/auth/login", "http://localhost:3002")
  //      = "http://localhost:3002/auth/login"

  // 如果需要认证，添加 Authorization Header
  const requestHeaders = new Headers(headers);
  if (auth) {
    const accessToken = await getAdminAccessToken();
    requestHeaders.set('authorization', `Bearer ${accessToken}`);
  }

  // 发起请求
  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    cache: 'no-store',
  });

  return await response.json();
}
```

**`new URL()` 工作原理**:

```javascript
// 例子 1: 绝对路径
new URL('/auth/login', 'http://localhost:3002');
// → "http://localhost:3002/auth/login"

// 例子 2: 相对路径
new URL('auth/login', 'http://localhost:3002/');
// → "http://localhost:3002/auth/login"

// 例子 3: 带查询参数
new URL('/auth/login?foo=bar', 'http://localhost:3002');
// → "http://localhost:3002/auth/login?foo=bar"
```

**实际发起的请求**:

```http
POST http://localhost:3002/auth/login HTTP/1.1
Host: localhost:3002
Content-Type: application/json
Accept: application/json

{"account":"admin","password":"password123"}
```

---

### 第 5 步：Backend 接收请求

**文件**: `apps/backend/src/auth/auth.controller.ts`

```typescript
// Line 13-20
@Controller("auth")  // 基础路径: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()  // 允许未登录访问
  @Post("login")  // 方法路径: /login
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const result = await this.authService.login(dto.account, dto.password, { ... });
    return result;  // { accessToken, refreshToken, user }
  }
}
```

**NestJS 路由解析**:

- `@Controller("auth")` → 基础路径: `/auth`
- `@Post("login")` → 方法路径: `/login`
- **完整路径**: `/auth/login`（没有 `/api` 前缀）

**为什么没有 `/api` 前缀？**

- Backend `main.ts` 中**没有设置** `app.setGlobalPrefix('api')`
- 所有 Controller 的路径都是直接使用 `@Controller()` 装饰器定义的值

---

## 🌐 生产环境：Nginx 的角色

在生产环境中，还有 Nginx 作为反向代理：

### 生产环境架构

```
浏览器 → Nginx (80/443) → Admin (3001) → Backend (3000)
```

### Nginx 配置

**文件**: `scripts/server-setup.sh` (Line 278-297)

```nginx
# 客户端请求 /api/* 全部代理到 Admin
location /api/ {
    proxy_pass http://localhost:3001;  # 转发到 Admin
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # ...
}
```

**流程**:

```
客户端: https://yourdomain.com/api/auth/login
   ↓
Nginx: 匹配 location /api/
   ↓
代理到: http://localhost:3001/api/auth/login (Admin)
   ↓
Admin: app/api/auth/login/route.ts
   ↓
转发到: http://localhost:3002/auth/login (Backend - 移除 /api)
   ↓
Backend: @Controller("auth") @Post("login")
```

---

## 🔑 关键设计原则

### 1. **BFF 模式（Backend For Frontend）**

**定义**: Admin 作为前端的专属后端层，处理：

- ✅ 路径转换（`/api/auth/login` → `/auth/login`）
- ✅ Token 管理（HttpOnly Cookie）
- ✅ 错误处理和响应格式统一
- ✅ CORS 避免（同源请求）

**优点**:

- 前端只需要知道 `/api/*` 的相对路径
- Backend 可以独立部署和演进
- Token 不暴露给浏览器 JS（安全）

---

### 2. **路径剥离策略**

**为什么要剥离 `/api` 前缀？**

| 层级      | 路径格式               | 原因                                           |
| --------- | ---------------------- | ---------------------------------------------- |
| 客户端    | `/api/auth/login`      | 明确标识这是 API 请求（非页面）                |
| Admin BFF | 接收 `/api/auth/login` | 符合前端约定                                   |
| Backend   | `/auth/login`          | Backend 不需要 `/api` 前缀（所有路由都是 API） |

**类比**:

- 客户端说："我要访问 API 的登录接口" → `/api/auth/login`
- Backend 说："我只有业务接口" → `/auth/login`
- Admin 翻译："客户端的 `/api` 前缀是给你看的，Backend 不需要"

---

### 3. **Token 安全管理**

**为什么不直接返回 token 给浏览器？**

```typescript
// ❌ 不安全的做法
return NextResponse.json({
  data: {
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // 暴露在 JS 中
    user: { ... }
  }
});

// ✅ 安全的做法（当前实现）
const response = NextResponse.json({
  data: { user: { ... } }  // 不返回 token
});
setAdminAccessToken(response, accessToken);  // 写入 HttpOnly Cookie
return response;
```

**HttpOnly Cookie 优势**:

- ✅ JavaScript 无法读取（防 XSS 攻击）
- ✅ 自动随请求发送（浏览器处理）
- ✅ 可以设置过期时间和 Secure 标志

---

## 📦 环境变量配置

### Admin 环境变量

**文件**: `apps/admin/.env.example`

```bash
# Backend API 基础 URL
BACKEND_BASE_URL=http://localhost:3002
```

**作用**: 告诉 Admin 如何连接 Backend

### Backend 环境变量

**文件**: `apps/backend/.env.example`

```bash
# Backend 监听端口
PORT=3002

# 允许的 CORS 来源（仅允许 Admin）
ADMIN_ORIGIN=http://localhost:3001
```

---

## 🧪 调试技巧

### 1. 使用浏览器开发者工具

**Network 面板观察**:

```
请求 URL: http://localhost:3001/api/auth/login
请求方法: POST
状态码: 200 OK

请求头:
  Content-Type: application/json
  Origin: http://localhost:3001

响应头:
  Set-Cookie: admin_access_token=xxx; HttpOnly; Path=/; SameSite=Lax
  Set-Cookie: admin_refresh_token=yyy; HttpOnly; Path=/; SameSite=Lax
```

**关键点**:

- ✅ 请求是发送到 `localhost:3001`（Admin）
- ✅ Cookie 是由 Admin 设置的（HttpOnly）
- ✅ 浏览器看不到真实的 Backend 地址

---

### 2. 使用 Backend 日志

**在 Backend 添加日志**:

```typescript
// apps/backend/src/auth/auth.controller.ts
@Post("login")
async login(@Body() dto: LoginDto, @Req() request: Request) {
  console.log('[AuthController] 收到登录请求:', {
    url: request.url,         // → "/auth/login"
    method: request.method,   // → "POST"
    body: dto
  });

  const result = await this.authService.login(dto.account, dto.password, { ... });
  return result;
}
```

**控制台输出**:

```
[AuthController] 收到登录请求: {
  url: '/auth/login',   ← 注意：没有 /api 前缀
  method: 'POST',
  body: { account: 'admin', password: '[REDACTED]' }
}
```

---

### 3. 使用 cURL 直接测试

**测试 Backend（绕过 Admin）**:

```bash
# 直接调用 Backend
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"password123"}'

# 期望响应:
# {
#   "code": 200,
#   "message": "success",
#   "data": {
#     "accessToken": "eyJ...",
#     "refreshToken": "abc...",
#     "user": { ... }
#   }
# }
```

**测试 Admin（通过 BFF）**:

```bash
# 调用 Admin 的 BFF 接口
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"password123"}' \
  -v  # 查看完整的响应头（包括 Set-Cookie）

# 期望响应:
# Set-Cookie: admin_access_token=xxx; HttpOnly; Path=/
# Set-Cookie: admin_refresh_token=yyy; HttpOnly; Path=/
#
# {
#   "code": 200,
#   "data": {
#     "user": { ... }  // 注意：不包含 token
#   }
# }
```

---

## 🎓 总结

### 路径转换总结

| 层级      | 收到的路径        | 转发的路径        | 转换方式                                 |
| --------- | ----------------- | ----------------- | ---------------------------------------- |
| 浏览器    | 用户操作          | `/api/auth/login` | 前端代码硬编码                           |
| Admin BFF | `/api/auth/login` | `/auth/login`     | `new URL("/auth/login", backendBaseUrl)` |
| Backend   | `/auth/login`     | -                 | `@Controller("auth") @Post("login")`     |

### 核心要点

1. **客户端永远调用 `/api/*`** - 符合前端约定，明确标识 API 请求
2. **Admin 作为 BFF 层** - 负责路径转换、Token 管理、错误处理
3. **Backend 只有业务路径** - 不需要 `/api` 前缀，所有路由都是 API
4. **HttpOnly Cookie 保证安全** - Token 不暴露给浏览器 JS

### 为什么设计成这样？

| 设计选择                 | 原因                   |
| ------------------------ | ---------------------- |
| 客户端调用同源 `/api/*`  | 避免 CORS 问题         |
| Admin 剥离 `/api` 前缀   | Backend 路径更简洁     |
| Backend 无 globalPrefix  | 历史原因，现在可以改进 |
| HttpOnly Cookie 存 Token | 防止 XSS 攻击          |

---

## 🚀 下一步：API 版本化改造

现在你理解了当前架构，就能明白为什么我们要添加 `/api/v1` 前缀：

### 改造前

```
客户端: /api/auth/login
Admin:  接收 /api/auth/login → 转发 /auth/login
Backend: 接收 /auth/login
```

### 改造后

```
客户端: /api/auth/login           ← 不变
Admin:  接收 /api/auth/login → 转发 /api/v1/auth/login  ← 修改转换逻辑
Backend: 接收 /api/v1/auth/login   ← 添加 globalPrefix
```

**关键修改**:

- Backend: `app.setGlobalPrefix('api/v1')`
- Admin: 修改路径转换逻辑，拼接 `/api/v1` 而不是直接去掉 `/api`

---

**文档版本**: v1.0
**最后更新**: 2025-12-31
**相关文档**:

- [API 版本化迁移方案](../guides/api-versioning/migration-guide.md)
- [项目结构文档](./overview.md)
