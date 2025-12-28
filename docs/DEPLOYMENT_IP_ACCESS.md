# 使用 IP 地址访问 SnapMatch 平台

## 📍 IP 访问地址

假设你的服务器 IP 是 `123.45.67.89`，访问地址如下：

| 应用            | 访问地址                   | 说明          |
| --------------- | -------------------------- | ------------- |
| **Web 官网**    | http://123.45.67.89/       | 前台展示页面  |
| **Admin 后台**  | http://123.45.67.89/admin/ | 管理后台      |
| **Backend API** | http://123.45.67.89/api/   | 后端 API 接口 |
| **健康检查**    | http://123.45.67.89/health | 服务健康状态  |

---

## ⚙️ 配置步骤

### 方案 A: 直接使用默认 80 端口（推荐）

#### 1. 修改 GitHub Actions 配置

编辑 `.github/workflows/deploy-production.yml`：

```yaml
env:
  NODE_VERSION: 20
  PNPM_VERSION: 10
  # 使用 IP 地址而非域名
  SERVER_IP: 123.45.67.89 # 替换为你的实际服务器 IP
  DEPLOY_PATH: /var/www/snapmatch # 或者使用 1Panel 路径
```

修改构建环境变量：

```yaml
- name: 构建 Web 前端
  run: pnpm -C apps/web build
  env:
    NEXT_PUBLIC_ADMIN_BASE_URL: http://123.45.67.89/admin

- name: 构建 Admin 后台
  run: pnpm -C apps/admin build
  env:
    NEXT_PUBLIC_API_BASE_URL: http://123.45.67.89/api
```

#### 2. 配置 OpenResty/Nginx

在 1Panel 中创建网站配置（或手动编辑）：

```nginx
server {
    listen 80;
    server_name 123.45.67.89;  # 使用 IP 地址

    # ========================================
    # Web 官网 (根路径)
    # ========================================
    location / {
        root /var/www/snapmatch/web;  # 或 1Panel 路径
        index index.html;
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # ========================================
    # Admin 后台 (/admin 路径)
    # ========================================
    location /admin {
        alias /var/www/snapmatch/admin;  # 或 1Panel 路径
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

        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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

#### 3. 使用 1Panel 部署路径

如果使用 1Panel 的默认路径结构，配置如下：

```nginx
server {
    listen 80;
    server_name 123.45.67.89;

	# Web 官网
	location / {
	    root /www/sites/123.45.67.89/index;
	    index index.html;
	    try_files $uri $uri.html $uri/ /index.html;
	}

	# Admin 后台
	location /admin {
	    alias /www/sites/123.45.67.89/admin;
	    index index.html;
	    try_files $uri $uri.html $uri/ /admin/index.html;
	}

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3002/health;
        access_log off;
    }
}
```

---

### 方案 B: 使用自定义端口

如果 80 端口被占用或需要使用其他端口：

#### 1. 配置不同端口

```nginx
server {
    listen 8080;  # 使用 8080 端口
    server_name 123.45.67.89;

    # ... 其他配置相同
}
```

#### 2. 访问地址

```
Web 官网:    http://123.45.67.89:8080/
Admin 后台:  http://123.45.67.89:8080/admin/
Backend API: http://123.45.67.89:8080/api/
健康检查:    http://123.45.67.89:8080/health
```

#### 3. 开放防火墙端口

```bash
# Ubuntu/Debian
sudo ufw allow 8080/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

---

## 🔧 1Panel 快速配置指南

### 通过 1Panel 面板配置（最简单）

1. **登录 1Panel**

   ```
   http://你的服务器IP:面板端口
   ```

2. **创建网站**
   - 导航到：网站 → 创建网站
   - 类型：静态网站
   - 域名：输入你的服务器 IP（如 `123.45.67.89`）
   - 端口：80（或自定义端口）
   - 根目录：选择或创建目录

3. **配置反向代理**
   - 进入网站设置 → 反向代理
   - 添加代理规则：

   ```
   代理名称: Backend API
   代理路径: /api/
   目标地址: http://127.0.0.1:3002/
   ```

   ```
   代理名称: Health Check
   代理路径: /health
   目标地址: http://127.0.0.1:3002/health
   ```

4. **上传静态文件**
   - 方式 1：通过 1Panel 文件管理器上传
   - 方式 2：使用 GitHub Actions 自动部署

---

## 📝 修改 GitHub Actions 配置示例

### 完整的 workflow 环境变量配置

```yaml
env:
  NODE_VERSION: 20
  PNPM_VERSION: 10
  # IP 访问配置
  SERVER_IP: 123.45.67.89  # 你的服务器 IP
  SERVER_PORT: 80  # 访问端口，默认 80
  # 1Panel 部署路径
  PANEL_BASE_PATH: /opt/1panel/apps/openresty/openresty/www/sites

# ... 其他配置

- name: 构建 Web 前端
  run: pnpm -C apps/web build
  env:
    NEXT_PUBLIC_ADMIN_BASE_URL: http://${{ env.SERVER_IP }}/admin

- name: 构建 Admin 后台
  run: pnpm -C apps/admin build
  env:
    NEXT_PUBLIC_API_BASE_URL: http://${{ env.SERVER_IP }}/api

- name: 部署 Web 到服务器
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    source: "apps/web/out/*"
    target: "${{ env.PANEL_BASE_PATH }}/${{ env.SERVER_IP }}/"
    strip_components: 3
    rm: true

- name: 部署 Admin 到服务器
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    source: "apps/admin/out/*"
    target: "${{ env.PANEL_BASE_PATH }}/${{ env.SERVER_IP }}/admin/"
    strip_components: 3
    rm: true
```

---

## ✅ 验证部署

### 1. 检查服务状态

```bash
# SSH 登录服务器后

# 检查 Backend 容器
docker ps | grep snapmatch-backend

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

### 2. 检查静态文件

```bash
	# 1Panel 默认路径
	ls -la /opt/1panel/apps/openresty/openresty/www/sites/123.45.67.89/index/
	ls -la /opt/1panel/apps/openresty/openresty/www/sites/123.45.67.89/admin/

# 自定义路径
ls -la /var/www/snapmatch/web/
ls -la /var/www/snapmatch/admin/
```

### 3. 测试访问

```bash
# 替换为你的实际 IP
SERVER_IP=123.45.67.89

# 测试 Web 官网
curl http://$SERVER_IP/

# 测试 Admin 后台
curl http://$SERVER_IP/admin/

# 测试 API 健康检查
curl http://$SERVER_IP/api/health
curl http://$SERVER_IP/health
```

### 4. 浏览器测试

在浏览器中访问：

- http://123.45.67.89/ （Web 官网）
- http://123.45.67.89/admin/ （Admin 后台）
- http://123.45.67.89/health （健康检查）

---

## 🐛 常见问题排查

### 问题 1: 无法访问（连接超时）

**原因:** 防火墙未开放端口

**解决:**

```bash
# 检查防火墙状态
sudo ufw status

# 开放 80 端口
sudo ufw allow 80/tcp

# 检查端口监听
netstat -tlnp | grep :80
```

### 问题 2: 403 Forbidden

**原因:** 文件权限或目录权限不足

**解决:**

```bash
	# 设置正确的文件权限
	sudo chown -R www-data:www-data /opt/1panel/apps/openresty/openresty/www/sites/123.45.67.89/index/
	sudo chmod -R 755 /opt/1panel/apps/openresty/openresty/www/sites/123.45.67.89/index/
```

### 问题 3: 502 Bad Gateway (API)

**原因:** Backend 容器未运行

**解决:**

```bash
# 检查容器状态
docker ps -a | grep snapmatch-backend

# 启动容器
docker start snapmatch-backend

# 查看日志
docker logs snapmatch-backend
```

### 问题 4: Admin 页面刷新 404

**原因:** Nginx 配置中 try_files 不正确

**解决:**
确保配置中包含：

```nginx
location /admin {
    alias /path/to/admin;
    index index.html;
    try_files $uri $uri.html $uri/ /admin/index.html;  # 关键行
}
```

---

## 🔐 安全建议

### 1. 限制访问（可选）

如果只需要特定 IP 访问，可以添加白名单：

```nginx
server {
    listen 80;
    server_name 123.45.67.89;

    # 仅允许特定 IP 访问
    allow 你的IP地址;
    deny all;

    # ... 其他配置
}
```

### 2. 使用自签名 SSL（可选）

即使没有备案，也可以使用自签名证书启用 HTTPS：

```bash
# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt
```

```nginx
server {
    listen 443 ssl;
    server_name 123.45.67.89;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    # ... 其他配置
}
```

⚠️ **注意:** 自签名证书会在浏览器中显示警告，但仍可使用。

---

## 📋 部署清单

完成以下步骤后即可使用 IP 访问：

- [ ] 修改 GitHub Actions 配置（使用 IP 替代域名）
- [ ] 配置 OpenResty/Nginx（server_name 使用 IP）
- [ ] Backend 容器运行正常
- [ ] 静态文件已部署到正确路径
- [ ] 反向代理配置正确（/api/ 和 /health）
- [ ] 防火墙已开放相应端口
- [ ] 可通过 IP 访问 Web 官网
- [ ] 可通过 IP 访问 Admin 后台
- [ ] 可通过 IP 调用 API

---

## 🚀 后续域名备案后切换

域名备案完成后，只需：

1. 修改 workflow 中的环境变量（IP → 域名）
2. 修改 OpenResty 配置（server_name）
3. 申请 SSL 证书（Let's Encrypt 免费）
4. 重新部署

无需修改代码！

---

**✅ 配置完成后，即可通过 IP 地址访问你的应用！**
