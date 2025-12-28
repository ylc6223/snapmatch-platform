# SnapMatch 线上访问配置指南

## 📍 访问地址

| 应用            | 访问地址                         | 说明          |
| --------------- | -------------------------------- | ------------- |
| **Web 官网**    | https://www.thepexels.art/       | 前台展示页面  |
| **Admin 后台**  | https://www.thepexels.art/admin/ | 管理后台      |
| **Backend API** | https://www.thepexels.art/api/   | 后端 API 接口 |
| **健康检查**    | https://www.thepexels.art/health | 服务健康状态  |

---

## ⚙️ OpenResty 反向代理配置

### 方法 1：通过 1Panel 面板配置（推荐）

1. **登录 1Panel 面板**
   - 访问: http://你的服务器IP:端口

2. **配置网站**
   - 导航到：网站 → 找到 `www.thepexels.art`
   - 点击：设置 → 配置文件

3. **添加反向代理规则**

在 `server` 块中添加以下配置：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.thepexels.art;

    # SSL 证书配置（1Panel 自动管理）
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ========================================
    # Web 官网 (根路径)
    # ========================================
    location / {
        root /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art;
        index index.html;
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # ========================================
    # Admin 后台 (/admin 路径)
    # ========================================
    location /admin {
        alias /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/admin;
        index index.html;
        try_files $uri $uri.html $uri/ /admin/index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # ========================================
    # Backend API (代理到 Docker 容器)
    # ========================================
    location /api/ {
        proxy_pass http://127.0.0.1:3002/;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓存控制
        proxy_cache_bypass $http_upgrade;
    }

    # ========================================
    # 健康检查端点
    # ========================================
    location /health {
        proxy_pass http://127.0.0.1:3002/health;
        access_log off;
    }
}
```

4. **重载配置**

   ```bash
   # 方法 A: 通过 1Panel 面板
   # 导航到：网站 → 重载配置

   # 方法 B: SSH 命令行
   docker exec 1panel-openresty openresty -t
   docker exec 1panel-openresty openresty -s reload
   ```

---

### 方法 2：使用配置脚本

项目中已包含服务器配置脚本 `scripts/server-setup.sh`，但需要根据 1Panel 环境调整。

---

## 🔍 验证部署

### 1. 检查 Backend 服务状态

```bash
# 查看 Backend 容器
docker ps | grep snapmatch-backend

# 查看容器日志
docker logs snapmatch-backend

# 检查健康状态
curl http://localhost:3002/health
```

**预期响应:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "uptime": 123.45
}
```

### 2. 检查 Admin 服务状态

**⚠️ Admin 需要 Node.js 运行时环境（PM2 管理）**

```bash
# 查看 PM2 进程状态
pm2 status snapmatch-admin

# 查看 Admin 日志
pm2 logs snapmatch-admin --lines 50

# 检查端口监听
netstat -tlnp | grep 3001

# 测试本地访问
curl http://localhost:3001/admin/
```

**预期 PM2 状态:**
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name             │ status  │ restart │ uptime   │ cpu    │
├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ snapmatch-admin  │ online  │ 0       │ 2h       │ 0.1%   │
└─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘
```

**如果服务未启动:**
```bash
cd /opt/1panel/apps/snapmatch/admin
pm2 start ecosystem.config.js
pm2 save
```

### 3. 检查 Web 静态文件

```bash
# 检查 Web 文件
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/

# 验证关键文件存在
test -f /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index.html && echo "✅ Web 文件存在"
```

### 4. 测试访问

```bash
# 测试 Web 官网
curl https://www.thepexels.art/

# 测试 Admin 后台
curl https://www.thepexels.art/admin/

# 测试 API
curl https://www.thepexels.art/api/health

# 测试健康检查
curl https://www.thepexels.art/health
```

---

## 🐛 常见问题排查

### 问题 1: 404 Not Found

**原因:** 静态文件未正确部署或路径配置错误

**解决:**

```bash
# 检查文件是否存在
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/

# 检查文件权限
sudo chown -R www-data:www-data /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/
sudo chmod -R 755 /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/
```

### 问题 2: 502 Bad Gateway (API 请求)

**原因:** Backend 容器未运行或端口映射错误

**解决:**

```bash
# 检查容器状态
docker ps | grep snapmatch-backend

# 重启容器
docker restart snapmatch-backend

# 检查端口监听
netstat -tlnp | grep 3002
```

### 问题 3: Admin 路由不工作

**原因:** Next.js basePath 配置问题

**解决:**

- 确保 `apps/admin/next.config.ts` 中 `basePath: '/admin'`
- 确保 OpenResty 配置中使用 `alias` 而非 `root`
- 确保 `try_files` 包含 `/admin/index.html`

### 问题 4: CORS 错误

**原因:** Backend 未配置 CORS 或代理头缺失

**解决:**
检查 Backend 代码中的 CORS 配置，确保允许前端域名。

---

## 📊 监控建议

### 1. 设置健康检查监控

使用 UptimeRobot、Prometheus 或其他监控工具定期检查：

- https://www.thepexels.art/health

### 2. 配置日志查看

```bash
# Backend 日志
docker logs -f snapmatch-backend

# OpenResty 访问日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.access.log

# OpenResty 错误日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.error.log
```

---

## 🔐 安全建议

1. **启用 HTTPS**
   - 通过 1Panel 面板申请 SSL 证书（Let's Encrypt）
   - 强制 HTTP 重定向到 HTTPS

2. **配置防火墙**

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **限制 Admin 访问**

   ```nginx
   location /admin {
       # 仅允许特定 IP 访问（可选）
       # allow 你的IP;
       # deny all;

       alias /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/admin;
       try_files $uri $uri.html $uri/ /admin/index.html;
   }
   ```

---

## 📝 部署清单

- [ ] Backend 容器运行正常 (`docker ps`)
- [ ] 静态文件已部署到正确路径
- [ ] OpenResty 反向代理已配置
- [ ] SSL 证书已配置（如需 HTTPS）
- [ ] 健康检查端点可访问
- [ ] Web 官网可正常访问
- [ ] Admin 后台可正常访问
- [ ] API 接口可正常调用
- [ ] 日志监控已配置
- [ ] 备份策略已制定

---

**完成以上配置后，你的应用应该可以正常访问了！** 🎉
