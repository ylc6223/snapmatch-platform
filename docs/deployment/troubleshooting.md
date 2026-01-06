# 部署常见问题排查（Troubleshooting）

本页记录生产部署中遇到的典型问题与排查路径，方便后续快速定位与回滚。

---

## 1) Admin 登录成功但一直跳回登录页（307 → /admin/login）

### 现象

- `POST /admin/api/auth/login` 返回 `200`，响应体正常
- 但访问 `/admin/dashboard/analytics` 会发生 `307 Temporary Redirect` 到：
  - `/admin/login?next=%2Fdashboard%2Fanalytics`

### 根因

**Cookie 带 `Secure`，但用户通过 `http://` 访问。**

- `Secure` Cookie 只会在 HTTPS 下被浏览器保存/回传
- 当 Admin 通过 `http://IP` 或 `http://域名` 访问时：
  - 登录接口虽然返回 `Set-Cookie`
  - 但浏览器不会保存/回传（或 curl 的 cookie jar 为空）
  - `/dashboard/*` 路由保护（`apps/admin/proxy.ts`）检测不到 `admin_access_token`，因此重定向回登录页

### 解决方案

#### 推荐（长期）

- 为 Admin 配置 HTTPS（即使域名未备案，HTTPS 技术上仍可用；但大陆访问质量取决于网络与接入方式）。

#### 临时（仅用于未上 HTTPS 的生产/内网）

- 在 Admin 进程环境变量中设置：
  - `ADMIN_COOKIE_SECURE=false`

该变量会显式控制登录态 Cookie 是否带 `Secure`（未设置时默认回退到 `NODE_ENV === "production"`）。

### 排查与验证

1. 检查登录响应是否仍带 `Secure`：

```bash
curl -i http://<host>/admin/api/auth/login \
  -H 'content-type: application/json' \
  --data-raw '{"account":"admin","password":"admin123"}' | head -n 40
```

预期：当 `ADMIN_COOKIE_SECURE=false` 时，`Set-Cookie` 行中不应出现 `Secure`。

2. 检查 PM2 进程环境变量（以 id=0 为例）：

```bash
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 env 0 | egrep 'ADMIN_COOKIE_SECURE|NODE_ENV|PORT' -n"
```

---

## 2) Workflow 更新了 PM2 env 但线上仍旧不生效

### 现象

- GitHub Actions 里生成/更新了 `ecosystem.config.js`
- 但线上 `Set-Cookie` 仍然带旧属性（例如仍带 `Secure`）
- `pm2 env <id>` 显示环境变量没有变化

### 根因

PM2 仅 `pm2 restart <name>` 时**可能沿用旧 env**，不会应用 `ecosystem.config.js` 的最新 `env`，除非显式开启更新。

### 解决方案

使用以下任一方式重载并更新 env：

- `pm2 startOrReload ecosystem.config.js --update-env`
- 或 `pm2 reload ecosystem.config.js --update-env`（视进程模式而定）

### 验证

- 重载后再次执行 `pm2 env <id>`，确认目标变量已更新
- 再用 `curl -i` 检查 `Set-Cookie` 是否按预期变化
