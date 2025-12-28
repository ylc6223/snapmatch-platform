# 📦 使用 1Panel 部署 SnapMatch 平台

> **适用场景**: 服务器已安装 1Panel 面板的用户
> **1Panel 版本**: v1.9.0+

本文档是 [部署完整指南](./deployment-guide.md) 的 **1Panel 专属版本**，简化了 Nginx 配置流程，通过 Web 界面完成所有配置。

---

## 🎯 1Panel 优势

相比手动配置 Nginx，使用 1Panel 有以下优势：

- ✅ **可视化配置** - 通过 Web 界面配置网站，无需编辑配置文件
- ✅ **一键 SSL** - 自动申请和续期 Let's Encrypt 证书
- ✅ **配置管理** - 统一管理多个网站配置
- ✅ **日志查看** - 方便查看访问日志和错误日志
- ✅ **备份恢复** - 支持配置备份和一键恢复

---

## 📋 与标准部署的差异对比

| 项目 | 标准部署 | 1Panel 部署 |
|------|---------|------------|
| **Nginx 安装** | `sudo apt install nginx` | 1Panel 自带 OpenResty |
| **配置文件** | 手动编辑 `/etc/nginx/sites-available/snapmatch` | Web 界面配置 |
| **SSL 证书** | 手动执行 `certbot --nginx` | Web 界面一键申请 |
| **配置测试** | `sudo nginx -t` | 自动验证 |
| **重启服务** | `sudo systemctl restart nginx` | Web 界面一键重启 |
| **部署目录** | `/var/www/snapmatch` | **1Panel 路径** `/opt/1panel/apps/openresty/openresty/www/sites/{域名}/` |

**🔑 关键区别**:
- **Web/Admin 目录**: 1Panel 自动创建 `/opt/1panel/apps/openresty/openresty/www/sites/{你的域名}/`
- **Backend 环境变量**: 独立目录 `/opt/1panel/apps/snapmatch/backend/.env.production`

---

## 🚀 快速开始

### 前置条件

- ✅ 服务器已安装 1Panel（[安装教程](https://1panel.cn/docs/installation/online_installation/)）
- ✅ 1Panel 版本 ≥ v1.9.0
- ✅ 已有域名并指向服务器 IP

---

## 📦 部署流程（6 个阶段）

### 阶段 1: 服务器环境准备

#### 1.1 检查 1Panel 状态

```bash
# SSH 登录服务器后执行

# 检查 1Panel 状态
sudo systemctl status 1panel

# 查看 1Panel 访问地址
sudo 1pctl status
```

**预期输出**:
```
Panel Status: Running
Panel Port: 12345
Panel Entrance: /abcd1234
Panel Address: http://YOUR_SERVER_IP:12345/abcd1234
```

#### 1.2 安装 Docker（如未安装）

1Panel 已内置 Docker 管理，但如果未安装 Docker：

**方法 1: 通过 1Panel Web 界面安装**
1. 登录 1Panel 控制台
2. 导航到 **容器** → **设置**
3. 点击 **安装 Docker**
4. 等待安装完成

**方法 2: 使用自动化脚本**
```bash
# 使用项目提供的脚本（会自动配置腾讯云镜像加速）
chmod +x scripts/server-setup.sh
./scripts/server-setup.sh
```

#### 1.3 创建 Backend 配置目录

**⚠️ 重要说明**:
- **Web/Admin 目录**: 1Panel 创建站点时自动生成，无需手动创建
- **Backend 配置**: 需要手动创建独立目录存放环境变量文件

```bash
# 创建 Backend 配置目录
sudo mkdir -p /opt/1panel/apps/snapmatch/backend
sudo chown -R $USER:$USER /opt/1panel/apps/snapmatch

# 验证
ls -la /opt/1panel/apps/snapmatch
```

**目录结构**:
```
/opt/1panel/apps/
├── openresty/
│   └── openresty/
│       └── www/
│           └── sites/
│               └── {你的域名}/           # 1Panel 自动创建
│                   ├── index.html        # Web 官网（GitHub Actions 部署）
│                   └── admin/            # Admin 后台（GitHub Actions 部署）
│                       └── index.html
└── snapmatch/
    └── backend/
        └── .env.production  # Backend 环境变量（手动创建）
```

**💡 重要概念: 为什么不需要 Node.js?**

本项目使用 **Next.js 静态导出模式** (`output: 'export'`),前端在 GitHub Actions 中预先构建为纯静态 HTML/CSS/JS 文件:

```
构建阶段 (GitHub Actions)       运行阶段 (1Panel 服务器)
┌──────────────────────┐       ┌──────────────────────┐
│ ✅ 需要 Node.js       │       │ ❌ 不需要 Node.js     │
│ ├─ pnpm build         │ ───▶  │ ├─ OpenResty/Nginx   │
│ ├─ Next.js 编译器     │       │ ├─ 静态 HTML 文件    │
│ └─ 生成 out/ 目录     │       │ └─ 直接托管文件      │
└──────────────────────┘       └──────────────────────┘
```

- **Backend**: Docker 容器内已包含 Node.js 20
- **Frontend**: 静态文件，通过 OpenResty (1Panel 自带) 托管
- **工具命令**: 可选安装 Node.js，或使用 OpenSSL 生成密钥

#### 1.4 配置 Backend 环境变量

**步骤 1: 生成 JWT_SECRET 密钥**

选择以下任一方式生成 32 字节随机密钥：

**方法 1: 使用 OpenSSL（推荐，无需 Node.js）**
```bash
openssl rand -hex 32
# 输出示例: 4f2e8c9a1b3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
```

**方法 2: 使用 Node.js（如已安装）**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法 3: 本地生成后复制**
```bash
# 在本地电脑执行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 复制输出结果
```

**步骤 2: 创建环境变量文件**

```bash
# 创建环境变量文件
nano /opt/1panel/apps/snapmatch/backend/.env.production
```

**内容**:
```bash
# ========================================
# SnapMatch Backend 生产环境配置
# ========================================

NODE_ENV=production
PORT=3002

# ========================================
# JWT 认证配置
# ========================================
# 使用上面生成的密钥替换下面的值
JWT_SECRET=你的32字节随机密钥

JWT_EXPIRES_IN=12h
AUTH_REFRESH_TOKEN_TTL_DAYS=30

# ========================================
# CORS 配置
# ========================================
ADMIN_ORIGIN=https://www.thepexels.art  # 替换为你的域名

# ========================================
# CloudBase 配置
# ========================================
CLOUDBASE_ENV=你的环境ID
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=你的密钥ID
CLOUDBASE_SECRET_KEY=你的密钥Key

# ========================================
# RBAC 数据模型（保持默认）
# ========================================
CLOUDBASE_MODEL_USERS=rbac_users
CLOUDBASE_MODEL_AUTH_SESSIONS=auth_sessions
CLOUDBASE_MODEL_RBAC_ROLES=rbac_roles
CLOUDBASE_MODEL_RBAC_PERMISSIONS=rbac_permissions
CLOUDBASE_MODEL_RBAC_ROLE_PERMISSIONS=rbac_role_permissions
CLOUDBASE_MODEL_RBAC_USER_ROLES=rbac_user_roles
```

**设置权限**:
```bash
chmod 600 /opt/1panel/apps/snapmatch/backend/.env.production
```

---

### 阶段 2: 1Panel 网站配置

#### 2.1 创建主站点（Web 官网）

**步骤 1: 登录 1Panel**
- 访问: `http://YOUR_SERVER_IP:端口/入口路径`
- 输入用户名和密码

**步骤 2: 创建网站**
1. 导航到 **网站** → **网站** → **创建网站**
2. 填写配置:

| 配置项 | 值 |
|--------|-----|
| **网站类型** | 静态网站 |
| **主域名** | `www.thepexels.art`（替换为你的域名） |
| **代号** | `www.thepexels.art`（与主域名相同） |
| **备注** | SnapMatch 官网 |
| **PHP 版本** | 无需选择（静态网站） |

**⚠️ 关键说明**:
- 1Panel 会自动创建目录：`/opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/`
- GitHub Actions 会自动部署到这个目录
- **无需手动指定网站根目录**，使用 1Panel 默认路径即可

3. 点击 **确定** 创建

**步骤 3: 配置首页规则**
1. 找到刚创建的网站，点击 **设置**
2. 导航到 **基础配置** → **默认文档**
3. 添加以下顺序:
   - `index.html`
   - `index.htm`
4. 保存配置

**步骤 4: 配置 URL 重写（重要）**
1. 仍在网站设置中，导航到 **伪静态**
2. 选择 **自定义**，填入以下规则:

```nginx
location / {
    try_files $uri $uri.html $uri/ =404;
    add_header Cache-Control "public, max-age=3600";
}
```

3. 保存配置

#### 2.2 创建管理后台（Admin）

**步骤 1: 创建网站**
1. 导航到 **网站** → **网站** → **创建网站**
2. 填写配置:

| 配置项 | 值 |
|--------|-----|
| **网站类型** | 静态网站 |
| **主域名** | `www.thepexels.art`（与主站相同） |
| **备注** | SnapMatch Admin（不创建新网站） |

**⚠️ 重要**: Admin 不需要创建独立网站，而是通过主站的 **反向代理** 配置 `/admin` 路径。

**步骤 2: 在主站配置 Admin 路径**
1. 打开主站（`www.thepexels.art`）的设置
2. 导航到 **反向代理** → **添加代理**
3. 填写配置:

| 配置项 | 值 |
|--------|-----|
| **名称** | Admin 后台 |
| **代理地址** | `/admin` |
| **目标地址** | `http://127.0.0.1:9999` （临时占位） |

4. 点击 **高级配置**，填入自定义配置:

```nginx
location /admin {
    alias /var/www/snapmatch/admin;
    try_files $uri $uri.html $uri/ /admin/index.html;
    add_header Cache-Control "no-cache, must-revalidate";
}
```

5. **删除** 目标地址配置（我们使用 alias，不需要代理）
6. 保存配置

#### 2.3 配置 Backend API 反向代理

**步骤 1: 添加反向代理**
1. 仍在主站设置中，导航到 **反向代理** → **添加代理**
2. 填写配置:

| 配置项 | 值 |
|--------|-----|
| **名称** | Backend API |
| **代理地址** | `/api` |
| **目标地址** | `http://127.0.0.1:3002` |

3. 点击 **高级配置**，填入:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3002/;
    proxy_http_version 1.1;

    # 代理头
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
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
```

4. 保存配置

#### 2.4 配置健康检查端点

```nginx
location /health {
    proxy_pass http://127.0.0.1:3002/health;
    access_log off;
}
```

添加方式同上，在反向代理中新增。

---

### 阶段 3: SSL 证书配置（生产环境必需）

#### 3.1 一键申请 Let's Encrypt 证书

**步骤 1: 申请证书**
1. 在主站设置中，导航到 **HTTPS**
2. 点击 **申请证书**
3. 填写配置:

| 配置项 | 值 |
|--------|-----|
| **证书类型** | Let's Encrypt |
| **域名** | `www.thepexels.art`（你的域名） |
| **DNS 提供商** | 手动验证 或 选择你的 DNS 提供商 |
| **邮箱** | 你的邮箱 |

4. 点击 **申请**，等待证书颁发

**步骤 2: 启用 HTTPS**
1. 证书申请成功后，切换到 **HTTPS** 标签
2. 启用 **强制 HTTPS**（HTTP 自动跳转到 HTTPS）
3. 启用 **HTTP/2**（提升性能）
4. 保存配置

#### 3.2 自动续期验证

1Panel 会自动续期 Let's Encrypt 证书（每 60 天），无需手动操作。

验证自动续期配置:
```bash
# 查看证书续期任务
sudo 1pctl cert renew --test
```

---

### 阶段 4: GitHub 配置（与标准部署相同）

#### 4.1 配置 GitHub Secrets

在 GitHub 仓库 **Settings** → **Secrets and variables** → **Actions** 中添加:

| Secret Name | 值 | 说明 |
|-------------|-----|------|
| `SERVER_HOST` | 你的服务器 IP | 例如: `123.45.67.89` |
| `SERVER_USER` | SSH 用户名 | 例如: `ubuntu` |
| `SERVER_SSH_KEY` | SSH 私钥完整内容 | 包含 `BEGIN` 和 `END` |

**生成 SSH 密钥**:
```bash
# 本地执行
ssh-keygen -t ed25519 -C "github-actions-snapmatch" -f ~/.ssh/snapmatch_deploy

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/snapmatch_deploy.pub user@server-ip

# 复制私钥内容（粘贴到 GitHub Secrets）
cat ~/.ssh/snapmatch_deploy
```

#### 4.2 配置 GitHub Actions 部署路径

**文件**: `.github/workflows/deploy-production.yml`

**⚠️ 关键配置** - 修改工作流顶部的路径变量：

```yaml
# 第 8-13 行 - 1Panel 路径配置
env:
  NODE_VERSION: 20
  PNPM_VERSION: 10
  # ⚠️ 1Panel 部署路径配置 - 请根据实际域名修改
  SITE_DOMAIN: www.thepexels.art  # 替换为你的实际域名
  PANEL_BASE_PATH: /opt/1panel/apps/openresty/openresty/www/sites
```

**步骤 1: 修改域名配置**

1. 打开 `.github/workflows/deploy-production.yml`
2. 找到第 12 行的 `SITE_DOMAIN`
3. 将 `www.thepexels.art` 替换为你的实际域名
4. 保存文件

**步骤 2: 确认构建环境变量**

```yaml
# 第 130 行 - Web 前端构建
- name: 构建 Web 前端
  env:
    NEXT_PUBLIC_ADMIN_BASE_URL: https://你的域名/admin  # 替换域名

# 第 135 行 - Admin 后台构建
- name: 构建 Admin 后台
  env:
    NEXT_PUBLIC_API_BASE_URL: https://你的域名/api  # 替换域名
```

**部署路径说明**（自动生成，无需手动修改）:
```yaml
# Web 部署目标（自动使用 PANEL_BASE_PATH + SITE_DOMAIN）
target: "${{ env.PANEL_BASE_PATH }}/${{ env.SITE_DOMAIN }}/"
# 实际路径: /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/

# Admin 部署目标（自动添加 /admin 子目录）
target: "${{ env.PANEL_BASE_PATH }}/${{ env.SITE_DOMAIN }}/admin/"
# 实际路径: /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/admin/
```

---

### 阶段 5: 部署 Backend Docker 容器

#### 5.1 通过 1Panel 管理 Docker

**选项 A: 使用 1Panel 容器管理（推荐新手）**

1. 在 1Panel 中，导航到 **容器** → **容器**
2. 等待 GitHub Actions 部署完成后，容器会自动创建（由 GitHub Actions 脚本启动）
3. 在 1Panel 中可以查看容器状态、日志、资源占用

**选项 B: 使用命令行（高级用户）**

```bash
# SSH 到服务器后，容器已由 GitHub Actions 自动创建
# 查看容器状态
docker ps | grep snapmatch-backend

# 查看日志
docker logs -f snapmatch-backend

# 重启容器
docker restart snapmatch-backend
```

#### 5.2 验证 Backend 运行

```bash
# 测试健康检查
curl http://localhost:3002/health

# 预期输出
{"status":"ok","timestamp":"2025-12-28T12:00:00.000Z","uptime":123.45}
```

---

### 阶段 6: 触发首次部署

#### 6.1 创建版本标签

```bash
# 在本地仓库执行

# 1. 确认所有更改已提交
git status

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送标签到 GitHub（触发自动部署）
git push origin v1.0.0
```

#### 6.2 监控部署进度

1. 访问 GitHub Actions 页面:
   - `https://github.com/你的用户名/snapmatch-platform/actions`

2. 查看最新的 **Deploy to Production** 工作流

3. 等待所有步骤完成:
   - ✅ 代码质量检查
   - ✅ Backend Docker 镜像构建
   - ✅ Backend 部署到服务器
   - ✅ Web 前端构建与部署
   - ✅ Admin 后台构建与部署
   - ✅ Nginx 重启（1Panel 自动处理）

**预计时间**: 5-8 分钟

---

## ✅ 部署验证

### 验证清单

在 1Panel 中完成以下检查:

#### 1. Backend 容器运行状态

**1Panel 界面验证**:
1. 导航到 **容器** → **容器**
2. 找到 `snapmatch-backend`
3. 状态应为 **运行中**（绿色）

**命令行验证**:
```bash
docker ps | grep snapmatch-backend
# 应显示 Up xx minutes
```

#### 2. 健康检查端点

**通过 1Panel 测试**:
1. 在网站设置中，导航到 **访问日志**
2. 访问 `https://www.thepexels.art/health`
3. 应返回 JSON 响应

**命令行测试**:
```bash
curl https://www.thepexels.art/health
# {"status":"ok",...}
```

#### 3. Web 官网访问

**浏览器测试**:
- 访问: `https://www.thepexels.art`
- 应显示官网首页
- 检查 HTTPS 小锁图标（证书有效）

#### 4. Admin 后台访问

**浏览器测试**:
- 访问: `https://www.thepexels.art/admin`
- 应显示管理后台登录页
- 测试登录功能

#### 5. API 接口测试

```bash
# 测试 API 端点
curl https://www.thepexels.art/api/你的接口路径
```

---

## 🔧 日常运维（1Panel 特有）

### 1. 查看网站日志

**通过 1Panel 界面**:
1. 导航到 **网站** → 选择你的网站 → **设置**
2. 点击 **访问日志** 或 **错误日志**
3. 实时查看日志流

**通过命令行**:
```bash
# 访问日志
tail -f /opt/1panel/apps/openresty/www/sites/www.thepexels.art/log/access.log

# 错误日志
tail -f /opt/1panel/apps/openresty/www/sites/www.thepexels.art/log/error.log
```

### 2. 修改网站配置

**通过 1Panel 界面**:
1. 导航到 **网站** → 选择你的网站 → **设置**
2. 修改配置（无需手动编辑文件）
3. 保存后自动生效（1Panel 自动重载 OpenResty）

### 3. 重启 OpenResty

**通过 1Panel 界面**:
1. 导航到 **网站** → **运行环境** → **OpenResty**
2. 点击 **重启**

**通过命令行**:
```bash
sudo 1pctl restart openresty
```

### 4. 备份网站配置

**通过 1Panel 界面**:
1. 导航到 **面板设置** → **备份账号**
2. 配置备份策略（本地/阿里云 OSS/腾讯云 COS）
3. 手动备份或定时备份

---

## 🆘 常见问题（1Panel 专属）

### 问题 1: 1Panel 无法访问

**现象**: 浏览器无法打开 1Panel 控制台

**解决方案**:
```bash
# 1. 检查 1Panel 服务状态
sudo systemctl status 1panel

# 2. 查看 1Panel 访问地址和端口
sudo 1pctl status

# 3. 检查防火墙
sudo ufw status
sudo ufw allow 端口号/tcp

# 4. 检查安全组（腾讯云/阿里云）
# 确保 1Panel 端口已开放
```

### 问题 2: 网站配置保存后未生效

**现象**: 修改配置后网站行为未改变

**解决方案**:
1. 在 1Panel 中手动重启 OpenResty
2. 清除浏览器缓存
3. 检查配置语法是否正确（1Panel 会自动验证）

### 问题 3: SSL 证书申请失败

**现象**: Let's Encrypt 证书申请失败

**常见原因**:
1. **DNS 未解析**: 确保域名已指向服务器 IP
   ```bash
   # 验证 DNS 解析
   nslookup www.thepexels.art
   ```

2. **端口 80/443 未开放**: 检查防火墙和安全组
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **频率限制**: Let's Encrypt 有申请频率限制（每周 5 次）
   - 等待一周后重试
   - 或使用手动 DNS 验证方式

### 问题 4: 部署后网站显示 404

**现象**: 访问网站显示 404 Not Found

**排查步骤**:
1. **检查文件是否部署成功**:
   ```bash
   ls -la /var/www/snapmatch/web
   # 应该看到 index.html 等文件
   ```

2. **检查 1Panel 网站根目录配置**:
   - 导航到网站设置
   - 确认 **网站根目录** 为 `/var/www/snapmatch/web`

3. **检查文件权限**:
   ```bash
   sudo chown -R www-data:www-data /var/www/snapmatch/web
   sudo chmod -R 755 /var/www/snapmatch/web
   ```

4. **查看错误日志**:
   - 在 1Panel 中查看网站错误日志
   - 确认具体错误原因

### 问题 5: Admin 后台路径冲突

**现象**: `/admin` 路径无法访问

**解决方案**:
1. 确认反向代理配置优先级:
   - 1Panel 中，**location 配置顺序很重要**
   - `/admin` 应在 `/` 之前匹配

2. 检查 `alias` 配置:
   ```nginx
   location /admin {
       alias /var/www/snapmatch/admin;  # 使用 alias，不是 root
       try_files $uri $uri.html $uri/ /admin/index.html;
   }
   ```

3. 重启 OpenResty 使配置生效

---

## 📊 性能优化（1Panel 环境）

### 1. 启用 Gzip 压缩

**通过 1Panel 界面**:
1. 导航到 **网站** → **运行环境** → **OpenResty**
2. 点击 **配置修改**
3. 在 `http` 块中添加:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
gzip_disable "msie6";
```

4. 保存并重启 OpenResty

### 2. 配置浏览器缓存

**在网站设置中配置**:
1. 导航到 **网站设置** → **伪静态**
2. 添加静态资源缓存规则:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 启用 HTTP/2

**在 HTTPS 设置中启用**:
1. 导航到 **网站设置** → **HTTPS**
2. 启用 **HTTP/2**（需先配置 SSL）

---

## 📖 相关文档

- **1Panel 官方文档**: https://1panel.cn/docs/
- **标准部署指南**: [deployment-guide.md](./deployment-guide.md)
- **部署检查清单**: [deployment-checklist.md](./deployment-checklist.md)
- **文档导航**: [docs/README.md](./README.md)

---

## 🎉 总结

使用 1Panel 部署 SnapMatch 平台的关键要点：

1. ✅ **部署目录保持不变**: 仍使用 `/var/www/snapmatch`
2. ✅ **配置方式改变**: 从手动编辑配置文件改为 Web 界面操作
3. ✅ **自动化部署不变**: GitHub Actions 部署流程完全相同
4. ✅ **SSL 更简单**: 一键申请 Let's Encrypt 证书
5. ✅ **运维更方便**: 日志查看、配置修改、服务重启都在 Web 界面完成

**祝部署顺利！** 🎉
