# Admin 独立子域（`admin.xx.xx`）迁移方案

本文目标：将当前“Admin 通过 `basePath=/admin` 挂载在主站域名下”的部署方式，迁移为 **Admin 独立子域**
（例如 `admin.xx.xx`）。迁移后：

- Admin 的路由与登录页不再被主站 `/login` 等路径干扰
- `/api/*` 仍保持 **同源 BFF**（浏览器只请求 `admin.xx.xx/api/*`，由 Next 转发到后端）
- Nginx 配置更简单，减少 `basePath`/重写带来的问题

---

## 1. 当前问题（为什么要迁移）

当前形态：主站域名（如 `www.xx.xx`）同时承载主站 Web 与 Admin，Admin 使用 `basePath: '/admin'`。

常见问题：

- **路径冲突**：Admin 未登录跳转到 `/login` 时，命中主站的 login 页面（而不是 `/admin/login`）。
- **反向代理复杂**：需要同时处理 `/admin/*`、`/api/*`、以及 `basePath` 下的静态资源路径。
- **调试困难**：用 IP + HTTP 访问时，`Secure` Cookie 不会被保存，导致“登录后立刻掉线/跳回 login”。

---

## 2. 目标架构（推荐）

对外只暴露 Admin 子域入口：

- `https://admin.xx.xx/*` → Next.js Admin（Node 运行时）
- `https://admin.xx.xx/api/*` → 同样先到 Next.js（BFF）
- Next.js（BFF）内部再调用后端：`http://127.0.0.1:3002/*`（或内网地址）

后端仍可保持当前部署（Docker 端口映射 `3002:3000`）。

---

## 3. 变更清单（你需要改哪些）

### 3.1 DNS / 证书

1. 为 Admin 增加 DNS 解析：

- `admin.xx.xx` → 服务器公网 IP

2. 为 `admin.xx.xx` 申请并部署证书（建议 Let’s Encrypt / 1Panel 面板）

> Admin 建议强制使用 HTTPS：Cookie 与安全策略更稳定（`Secure`、`SameSite`）。

### 3.2 Nginx/OpenResty（新增一个 server 块）

为 `admin.xx.xx` 新增独立站点配置，核心是把所有请求都交给 Next（包含 `/api/*`）。

示例：

```nginx
server {
  listen 80;
  server_name admin.xx.xx;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name admin.xx.xx;

  # ssl_certificate /path/to/fullchain.pem;
  # ssl_certificate_key /path/to/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 60s;
  }
}
```

> 迁移后不再需要 `/admin/` 的 path-based 代理；Next 在子域根路径运行即可。

### 3.3 Admin（Next.js）配置调整

迁移到子域根路径后，建议去掉 `basePath`：

- 修改 `apps/admin/next.config.ts`：删除 `basePath: '/admin'`

是否保留 `trailingSlash: true` 由你决定：

- 保留：路径统一带尾 `/`，对静态资源/部分网关行为更稳定，但会出现 308 重定向（正常）。
- 关闭：URL 更“干净”，但要确保网关与 Next 行为一致。

### 3.4 环境变量（后端地址）

Admin 的 BFF 会在服务端访问后端，建议显式配置：

- `BACKEND_BASE_URL=http://127.0.0.1:3002`

并确保后端容器映射与宿主机可达：

- `curl -i http://127.0.0.1:3002/health`

---

## 4. Cookie 与登录态建议

在独立子域下，Cookie 的最推荐行为：

- Cookie `Path=/`
- `SameSite=Lax`
- `Secure=true`（HTTPS 下）
- 不需要设置 `Domain`（让浏览器默认仅对 `admin.xx.xx` 生效，避免污染主站）

> 这样 Admin 的登录态不会影响主站，也不会被主站的 `/login` 路由干扰。

---

## 5. 迁移步骤（建议顺序）

1. DNS：添加 `admin.xx.xx` 解析到服务器
2. Nginx：新增 `admin.xx.xx` 的 server 配置，并上线证书
3. Admin：移除 `basePath`，重新构建并发布 Admin 服务
4. Admin：配置 `BACKEND_BASE_URL=http://127.0.0.1:3002`
5. 验证：
   - `curl -i https://admin.xx.xx/api/auth/login`（不带 body 可能 400/405，但不应 404）
   - 浏览器访问 `https://admin.xx.xx/login` 登录成功后进入 dashboard

---

## 6. 回滚方案

如果需要快速回滚到旧形态：

1. 保留旧的主站 `server {}` 配置（`/admin/` 按路径代理）
2. 停用或删除 `admin.xx.xx` 的 Nginx 站点配置
3. 恢复 `apps/admin/next.config.ts` 的 `basePath: '/admin'` 后重新构建并发布

---

## 7. 常见坑排查

### 7.1 登录成功但立刻掉线

- 检查是否使用了 HTTP（`Secure` Cookie 在 HTTP 下不会被浏览器保存）
- 必须使用 `https://admin.xx.xx`

### 7.2 `/api/*` 仍然 404

- 确认 `admin.xx.xx` 的 Nginx 是把所有路径都 `proxy_pass` 到 `3001`
- 确认 Next 服务确实在 `3001` 监听且可访问
