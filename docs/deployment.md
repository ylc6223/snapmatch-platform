# 部署指南（Monorepo：Web + Admin）

本仓库为 Monorepo，包含两个 Next.js 应用：

- `apps/web`：官网站点（对外）
- `apps/admin`：管理后台（内部）
 
并包含一个后端 API 服务：

- `apps/backend`：后台 API（NestJS，默认 `http://localhost:3002`）

同时，`apps/web` 的「管理员登录」按钮会跳转到 Admin 的登录页（默认生产为 `/admin/login`，可通过环境变量覆盖）。

---

## 1. 本地运行（推荐端口）

为了避免端口冲突，建议：

- Web：`http://localhost:3000`
- Admin：`http://localhost:3001`
- Backend：`http://localhost:3002`

启动方式：

```bash
# Web
pnpm -C apps/web dev

# Admin（指定端口）
PORT=3001 pnpm -C apps/admin dev

# Backend
pnpm -C apps/backend dev
```

Web → Admin 跳转在本地默认指向 `http://localhost:3001/login`，无需额外配置。

---

## 2. 环境变量（Web 侧跳转）

Web 的管理员登录跳转由 `NEXT_PUBLIC_ADMIN_BASE_URL` 控制：

- 未设置时：
  - 本地（`NODE_ENV=development`）：默认 `http://localhost:3001`
  - 线上（`NODE_ENV=production`）：默认 `/admin`
- 设置后：会拼接 `/login` 作为最终地址

示例（Admin 独立域名）：

```bash
NEXT_PUBLIC_ADMIN_BASE_URL="https://admin.example.com"
```

示例（同域名路径前缀）：

```bash
NEXT_PUBLIC_ADMIN_BASE_URL="/admin"
```

---

## 3. 构建与启动（Node 方式）

### Web

```bash
pnpm -C apps/web build
pnpm -C apps/web start
```

默认会监听 `3000`（可通过 `PORT` 覆盖）。

### Admin

```bash
pnpm -C apps/admin build
PORT=3001 pnpm -C apps/admin start
```

---

## 4. 线上部署形态（推荐两种）

### 方案 A：Web 与 Admin 分开部署（推荐）

将 `apps/web`、`apps/admin` 部署为两个独立站点（两个域名或子域名）：

- `https://www.example.com` → Web
- `https://admin.example.com` → Admin

并在 Web 的部署环境变量中设置：

```bash
NEXT_PUBLIC_ADMIN_BASE_URL="https://admin.example.com"
```

优点：配置最简单、与任意托管平台兼容、无需路径重写。

---

### 方案 B：同域名，Admin 挂载在 `/admin`（需要反向代理）

你希望最终效果为：

- `https://www.example.com/` → Web
- `https://www.example.com/admin/*` → Admin

此时有两种实现方式（二选一）：

#### B1：反向代理“剥离”前缀（推荐）

让反向代理把 `/admin` 前缀剥离后转发给 Admin 服务：

- 访问 `/admin/login` → 代理转发到 Admin 的 `/login`

Nginx 示例（核心逻辑：`rewrite` + `proxy_pass`）：

```nginx
upstream web_upstream { server 127.0.0.1:3000; }
upstream admin_upstream { server 127.0.0.1:3001; }

server {
  listen 80;
  server_name example.com;

  location /admin/ {
    rewrite ^/admin/?(.*)$ /$1 break;
    proxy_pass http://admin_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://web_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Web 侧无需额外配置（生产默认就是 `/admin`）。

#### B2：给 Admin 设置 `basePath="/admin"`

这需要对 `apps/admin` 的 Next.js 配置做适配（并处理静态资源路径），适用你不希望反向代理改写路径的情况。

如果你决定走这个方案，我可以按你的目标部署平台（Nginx / Cloudflare / Vercel / CloudBase 等）给出最合适的配置与改动点。

---

## 5. 字体离线（Web）

Web 已改为本地字体（`next/font/local`），字体文件在：

- `apps/web/app/fonts/Geist[wght].woff2`
- `apps/web/app/fonts/GeistMono[wght].woff2`

线上不会再请求 `fonts.gstatic.com`。
