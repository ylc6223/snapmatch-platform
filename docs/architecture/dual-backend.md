# 双后端架构解析 - Next.js BFF + NestJS API

> **核心理解**: SnapMatch Platform 实际上有**两个后端服务**
> **创建时间**: 2025-12-31

---

## 🎯 架构本质

### 是的，你有两个后端！

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层                                   │
│                                                                 │
│  浏览器 (React 组件)                                            │
│  - 用户界面                                                      │
│  - 交互逻辑                                                      │
│  - 状态管理                                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTP 请求 (/api/*)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    后端 #1: Next.js (Node.js)                   │
│                    端口: 3001                                    │
│                    框架: Next.js 16 + React 19                   │
│                    运行时: Node.js                               │
│ ─────────────────────────────────────────────────────────────── │
│  职责:                                                           │
│  ✅ SSR/SSG (服务端渲染)                                         │
│  ✅ Route Handlers (API Routes)  ← 这就是后端代码！             │
│  ✅ BFF 层 (Backend For Frontend)                               │
│  ✅ Token 管理 (HttpOnly Cookie)                                │
│  ✅ 路径转换 (/api/* → /auth/*)                                  │
│  ✅ 错误处理和响应格式化                                         │
│                                                                 │
│  技术特征:                                                       │
│  - 服务端代码 (Route Handlers, Server Components)              │
│  - 可以访问数据库、文件系统、环境变量                            │
│  - 有独立的服务端进程                                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTP 请求 (/auth/*, /users/*)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    后端 #2: NestJS (Node.js)                    │
│                    端口: 3002 (开发) / 3000 (生产)               │
│                    框架: NestJS 11 + TypeScript                  │
│                    运行时: Node.js                               │
│ ─────────────────────────────────────────────────────────────── │
│  职责:                                                           │
│  ✅ 核心业务逻辑 (RBAC 权限、用户管理)                           │
│  ✅ 数据库操作 (CloudBase 数据模型)                              │
│  ✅ 认证授权 (JWT 签发、验证)                                    │
│  ✅ 会话管理 (Refresh Token、踢出)                               │
│  ✅ API 提供者 (RESTful API)                                    │
│                                                                 │
│  技术特征:                                                       │
│  - 纯 API 服务（无前端视图）                                     │
│  - 模块化架构（Controllers, Services, Repositories）            │
│  - 依赖注入容器                                                  │
│  - 全局 Guards、Interceptors、Filters                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 双后端对比

| 维度           | 后端 #1: Next.js (Admin) | 后端 #2: NestJS (Backend)     |
| -------------- | ------------------------ | ----------------------------- |
| **定位**       | BFF（前端的后端）        | 核心 API 服务                 |
| **主要职责**   | 界面渲染 + API 代理      | 业务逻辑 + 数据访问           |
| **服务对象**   | 浏览器客户端             | Admin BFF（+ 未来其他客户端） |
| **端口**       | 3001                     | 3002 (开发) / 3000 (生产)     |
| **框架**       | Next.js (全栈框架)       | NestJS (纯后端框架)           |
| **代码语言**   | TypeScript + React       | TypeScript (纯 Node.js)       |
| **前端能力**   | ✅ 有（React 组件）      | ❌ 无                         |
| **后端能力**   | ✅ 有（Route Handlers）  | ✅ 有（Controllers）          |
| **数据库访问** | ❌ 无（通过 Backend）    | ✅ 有（CloudBase SDK）        |
| **认证实现**   | Cookie 管理              | JWT 签发和验证                |
| **部署方式**   | Standalone (SSR 服务器)  | Docker 容器                   |
| **依赖关系**   | 依赖 Backend             | 独立运行                      |

---

## 🏗️ 为什么需要两个后端？

### 传统单后端架构（不推荐）

```
浏览器
  ↓ 直接调用
NestJS Backend (3002)
  ↓
数据库
```

**问题**:

- ❌ CORS 跨域问题（前端和后端不同源）
- ❌ Token 暴露在浏览器 JS 中（localStorage）
- ❌ 前端需要处理复杂的认证逻辑
- ❌ 错误格式不统一

---

### 双后端架构（当前设计）

```
浏览器
  ↓ 同源请求 (/api/*)
Next.js BFF (3001)
  ↓ 内部调用
NestJS Backend (3002)
  ↓
数据库
```

**优势**:

- ✅ 无 CORS 问题（浏览器只访问同源 Next.js）
- ✅ Token 安全（HttpOnly Cookie，JS 不可读）
- ✅ 前端代码简洁（只需要调用 `/api/*`）
- ✅ 错误处理统一（BFF 层转换）
- ✅ Backend 可以独立演进
- ✅ 支持多种客户端（Web、移动端、桌面端）

---

## 🔍 两个后端的代码特征

### 后端 #1: Next.js - Route Handlers

**文件**: `apps/admin/app/api/auth/login/route.ts`

```typescript
import { NextResponse } from "next/server";

// ✅ 这是 Next.js 的服务端代码
export const runtime = "nodejs";  // 运行在 Node.js 环境

// ✅ 这是一个后端 API 端点
export async function POST(request: Request) {
  // 服务端逻辑：读取环境变量
  const backendUrl = process.env.BACKEND_BASE_URL;

  // 服务端逻辑：调用其他 API
  const response = await fetch(`${backendUrl}/auth/login`, { ... });

  // 服务端逻辑：操作 Cookie
  const nextResponse = NextResponse.json({ ... });
  nextResponse.cookies.set('token', accessToken, {
    httpOnly: true,  // 只能服务端读取
    secure: true
  });

  return nextResponse;
}
```

**关键点**:

- ✅ 在服务端运行（Node.js 进程）
- ✅ 可以访问环境变量（`process.env.*`）
- ✅ 可以操作 HttpOnly Cookie
- ✅ 可以调用其他后端 API
- ✅ 浏览器**永远看不到**这段代码的执行过程

---

### 后端 #2: NestJS - Controllers

**文件**: `apps/backend/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';

// ✅ 这是 NestJS 的后端代码
@Controller('auth') // 路由: /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // ✅ 这是一个纯后端 API 端点
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // 业务逻辑：验证密码
    const user = await this.authService.validateUser(dto.account, dto.password);

    // 业务逻辑：签发 JWT
    const accessToken = this.jwtService.sign({ userId: user.id });

    // 业务逻辑：保存会话
    await this.sessionService.create({ userId: user.id, token });

    return { accessToken, user };
  }
}
```

**关键点**:

- ✅ 纯后端服务（无前端视图）
- ✅ 模块化架构（依赖注入）
- ✅ 核心业务逻辑
- ✅ 数据库操作
- ✅ 永远不直接与浏览器通信（通过 BFF）

---

## 🎭 两个后端的角色分工

### Next.js BFF 的职责

```typescript
// apps/admin/app/api/auth/login/route.ts

export async function POST(request: Request) {
  // 1️⃣ 接收浏览器请求
  const body = await request.json();

  // 2️⃣ 校验参数（前端防御层）
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 3️⃣ 调用真正的后端（Backend）
  const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  // 4️⃣ 处理 Backend 响应
  const result = await backendResponse.json();

  // 5️⃣ Token 安全处理（关键！）
  const response = NextResponse.json({
    data: { user: result.data.user }, // 不返回 token
  });

  // 6️⃣ 写入 HttpOnly Cookie（JS 不可读）
  response.cookies.set('admin_access_token', result.data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
```

**总结**: BFF = **翻译器 + 安全守卫 + 错误处理器**

---

### NestJS Backend 的职责

```typescript
// apps/backend/src/auth/auth.controller.ts

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // 1️⃣ 核心业务逻辑
    const user = await this.usersService.findByAccount(dto.account);
    if (!user) throw new UnauthorizedException('账号不存在');

    // 2️⃣ 密码验证
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('密码错误');

    // 3️⃣ 签发 JWT
    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      roles: user.roles,
    });

    // 4️⃣ 生成 Refresh Token
    const refreshToken = this.generateRefreshToken();

    // 5️⃣ 保存会话
    await this.sessionService.create({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // 6️⃣ 返回完整数据（包括 token）
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
      },
    };
  }
}
```

**总结**: Backend = **业务逻辑 + 数据访问 + 认证授权**

---

## 🌐 完整请求流程（登录示例）

### 第 1 步：浏览器发起请求

```javascript
// 前端代码（运行在浏览器）
await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ account, password }),
});
```

**执行环境**: 浏览器（Chrome/Firefox/Safari）

---

### 第 2 步：Next.js BFF 接收（后端 #1）

```typescript
// 服务端代码（运行在 Node.js 进程）
export async function POST(request: Request) {
  // 这段代码在服务器上执行，浏览器看不到
  const body = await request.json();
  console.log('收到登录请求:', body); // 这个日志在服务器控制台

  // 调用 Backend
  const result = await fetch('http://localhost:3002/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return NextResponse.json(result);
}
```

**执行环境**: Next.js 服务器（Node.js 进程，端口 3001）

---

### 第 3 步：NestJS Backend 处理（后端 #2）

```typescript
// 服务端代码（运行在另一个 Node.js 进程）
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // 这段代码在另一个服务器进程执行
    console.log('Backend 收到请求:', dto); // 在 Backend 控制台

    // 核心业务逻辑
    const user = await this.authService.login(dto.account, dto.password);
    return { accessToken, user };
  }
}
```

**执行环境**: NestJS 服务器（Node.js 进程，端口 3002）

---

## 🎓 技术术语

### BFF（Backend For Frontend）

**定义**: 为特定前端定制的后端服务

**特点**:

- 🎯 专门服务于某一个前端（Web、iOS、Android 各有自己的 BFF）
- 🔄 充当前端和核心后端之间的适配器
- 🛡️ 处理前端特定的需求（认证、格式转换、聚合数据）

**在本项目中**:

- Admin (Next.js) = Web BFF
- 未来如果有移动端，可能会有 Mobile BFF

---

### SSR（Server-Side Rendering）

**定义**: 在服务器上渲染 React 组件生成 HTML

```typescript
// 这段代码在服务器上执行
export default async function DashboardPage() {
  // 服务端获取数据
  const user = await getUserFromBackend();

  // 服务端渲染 React 组件
  return (
    <div>
      <h1>Welcome, {user.name}</h1>  {/* 生成 HTML */}
    </div>
  );
}
```

**关键**: 这段代码既是"前端"（React 组件），又是"后端"（在服务器执行）

---

### Route Handlers（API Routes）

**定义**: Next.js 中的后端 API 端点

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  // 这是纯后端代码
  return NextResponse.json({ ... });
}
```

**等价于**: Express.js 的 `app.post('/api/auth/login', ...)`

---

## 🆚 对比其他架构

### 架构 1: 传统前后端分离

```
React (Vite)  →  Spring Boot / Django
  (3000)              (8080)
```

**问题**: CORS、Token 安全、部署复杂

---

### 架构 2: Next.js 纯 SSR（无独立后端）

```
Next.js (包含 API Routes + SSR)
  (3000)
   ↓
数据库
```

**问题**: 业务逻辑和前端耦合，难以复用

---

### 架构 3: 双后端（当前架构）✅

```
Next.js BFF  →  NestJS API
  (3001)          (3002)
                    ↓
                  数据库
```

**优势**: 关注点分离、安全、可扩展

---

## 💡 实际运行示例

### 启动两个后端

```bash
# 终端 1: 启动 Backend (后端 #2)
cd apps/backend
pnpm dev
# → 监听端口 3002
# → 输出: NestJS application successfully started

# 终端 2: 启动 Admin (后端 #1)
cd apps/admin
pnpm dev
# → 监听端口 3001
# → 输出: Next.js ready on http://localhost:3001
```

### 查看进程

```bash
# 查看运行的 Node.js 进程
ps aux | grep node

# 你会看到两个进程:
# node apps/backend/dist/main.js  (端口 3002)
# node apps/admin/.next/server.js (端口 3001)
```

### 测试两个后端

```bash
# 测试 Backend (后端 #2)
curl http://localhost:3002/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"test"}'
# → 返回: { accessToken, user }

# 测试 Admin BFF (后端 #1)
curl http://localhost:3001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"test"}'
# → 返回: { user } (不包含 token)
# → 设置 Cookie: admin_access_token=xxx
```

---

## 📊 资源对比

| 维度         | Next.js (后端 #1)  | NestJS (后端 #2)  |
| ------------ | ------------------ | ----------------- |
| **进程数**   | 1 个 Node.js 进程  | 1 个 Node.js 进程 |
| **内存占用** | ~200-300 MB        | ~100-150 MB       |
| **CPU 使用** | 中（SSR 渲染）     | 低（纯 API）      |
| **文件数量** | 大（包含前端资源） | 小（纯后端代码）  |
| **启动时间** | 较慢（需要编译）   | 较快              |
| **热重载**   | 支持               | 支持              |

---

## 🎯 总结

### 是的，你有两个后端！

| 后端                 | 本质                        | 主要职责                |
| -------------------- | --------------------------- | ----------------------- |
| **Next.js (Admin)**  | **全栈框架**（前端 + 后端） | SSR 渲染 + BFF 层       |
| **NestJS (Backend)** | **纯后端框架**              | 核心业务逻辑 + 数据访问 |

### 为什么不是"一个后端"？

因为：

- ✅ Next.js Route Handlers 是真正的后端代码（运行在服务器）
- ✅ 有独立的 Node.js 进程
- ✅ 可以访问数据库、环境变量、文件系统
- ✅ 浏览器永远看不到这段代码

### 类比

```
传统餐厅（单后端）:
  顾客 → 厨师 → 上菜

你的架构（双后端）:
  顾客 → 服务员 → 厨师 → 上菜
         ↑          ↑
      Next.js    NestJS
       (BFF)    (Backend)
```

服务员（BFF）的作用：

- 📋 理解顾客需求（前端特定逻辑）
- 🔄 翻译成厨房语言（路径转换）
- 🛡️ 保护顾客隐私（Token 管理）
- ✅ 检查菜品质量（错误处理）

---

**最后更新**: 2025-12-31
**相关文档**:

- [请求链路分析](./request-flow.md)
- [API 版本化迁移](../guides/api-versioning/migration-guide.md)
