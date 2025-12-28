# 📖 SnapMatch 平台部署完整指南

> **版本**: v1.0.0
> **更新日期**: 2025-12-28
> **部署方式**: GitHub Actions 自动部署到云服务器

## ⚠️ 重要提示：标准 Nginx 部署（不使用 1Panel）

**本指南适用于**:
- 全新服务器，未安装任何面板
- 需要完全控制服务器配置的开发者
- 熟悉 Linux 和 Nginx 的用户

**如果您的服务器已安装 1Panel 面板**，请使用 **[1Panel 部署指南](./deployment-1panel.md)** ⭐

**两种部署方式的主要区别**:
- **1Panel 部署**: 通过 Web 界面配置，一键 SSL，自动续期（推荐大多数用户）
- **标准 Nginx 部署**: 手动编辑配置文件，完全控制服务器（本文档）

---

## 📚 目录

- [1. 部署架构概览](#1-部署架构概览)
- [2. 文件结构说明](#2-文件结构说明)
- [3. 配置替换清单](#3-配置替换清单)
- [4. 部署前准备](#4-部署前准备)
- [5. 详细部署步骤](#5-详细部署步骤)
- [6. 配置文件模板](#6-配置文件模板)
- [7. 日常使用流程](#7-日常使用流程)
- [8. 故障排查](#8-故障排查)
- [9. 性能优化建议](#9-性能优化建议)

---

## 1. 部署架构概览

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     云服务器                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Nginx (反向代理 + 静态文件服务)                     │  │
│  │  ├─ / → Web 官网 (静态文件)                         │  │
│  │  ├─ /admin/* → Admin 后台 (静态文件)                │  │
│  │  └─ /api/* → Backend API (Docker 容器 :3002)       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Docker                                             │  │
│  │  └─ snapmatch-backend (NestJS)                     │  │
│  │     ├─ 端口: 3002                                   │  │
│  │     ├─ 健康检查: /health                            │  │
│  │     └─ 环境变量: .env.production                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  部署目录结构                                        │  │
│  │  /var/www/snapmatch/                               │  │
│  │  ├─ web/          (Web 前端静态文件)                │  │
│  │  ├─ admin/        (Admin 后台静态文件)              │  │
│  │  └─ backend/      (Backend 环境变量)                │  │
│  │     └─ .env.production                             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 访问地址

| 应用 | 访问路径 | 说明 |
|------|---------|------|
| Web 官网 | `https://www.yourdomain.com` | 客户端官网 |
| Admin 后台 | `https://www.yourdomain.com/admin` | 管理后台 |
| Backend API | `https://www.yourdomain.com/api/*` | 后端接口 |
| 健康检查 | `https://www.yourdomain.com/health` | 监控用 |

### 1.3 部署流程

```
本地开发 → 提交代码 → 打 Tag (v1.0.0) → GitHub Actions 自动部署
                                            ↓
                                       代码质量检查
                                            ↓
                                       构建 Docker 镜像
                                            ↓
                                       部署 Backend
                                            ↓
                                       健康检查
                                            ↓
                                       构建前端
                                            ↓
                                       部署前端
                                            ↓
                                       重启 Nginx
                                            ↓
                                       ✅ 完成
```

---

## 2. 文件结构说明

### 2.1 CI/CD 配置文件

#### `.github/workflows/deploy-production.yml`
**作用**: 生产环境自动部署工作流

**触发条件**: 推送版本标签（如 `v1.0.0`）

**主要步骤**:
1. 代码质量检查（Lint、TypeScript、测试）
2. 构建 Backend Docker 镜像
3. 部署 Backend 到服务器并启动容器
4. 健康检查确保 Backend 正常运行
5. 构建前端（Web + Admin）
6. 部署前端静态文件到服务器
7. 重启 Nginx 清除缓存

**需要替换的配置**:
- 第 12 行: `SITE_DOMAIN: www.thepexels.art` → 替换为你的域名
- 第 145 行: `NEXT_PUBLIC_ADMIN_BASE_URL: https://www.thepexels.art/admin` → 替换为你的域名/admin
- 第 150 行: `NEXT_PUBLIC_API_BASE_URL: https://www.thepexels.art/api` → 替换为你的域名/api

---

#### `.github/workflows/quality-check-pr.yml`
**作用**: Pull Request 代码质量检查

**触发条件**: 创建 PR 到 `main` 或 `dev` 分支

**主要步骤**:
1. Lint 代码风格检查
2. TypeScript 类型检查（Web、Admin、Backend）
3. Backend 单元测试

**无需配置**: 开箱即用

---

### 2.2 应用配置文件

#### `apps/web/next.config.mjs`
**作用**: Web 官网构建配置

**关键配置**:
```javascript
{
  output: 'export',         // 静态导出
  basePath: '',             // 根路径
  trailingSlash: true,      // URL 以 / 结尾
  images: { unoptimized: true }  // 不优化图片
}
```

**无需修改**: 已配置完成

---

#### `apps/admin/next.config.ts`
**作用**: Admin 后台构建配置

**关键配置**:
```typescript
{
  output: 'export',         // 静态导出
  basePath: '/admin',       // Admin 在 /admin 路径
  trailingSlash: true,
  images: { unoptimized: true }
}
```

**无需修改**: 已配置完成

---

#### `apps/backend/Dockerfile`
**作用**: Backend 容器化配置

**关键特性**:
- 多阶段构建（优化镜像体积）
- 非 root 用户运行（安全）
- 自动健康检查（每 30 秒）
- 暴露 3000 端口

**无需修改**: 已配置完成

---

#### `apps/backend/src/health/health.controller.ts`
**作用**: 健康检查端点

**响应格式**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "uptime": 3600.5
}
```

**无需修改**: 已配置完成

---

## 3. 配置替换清单

> ⚠️ **重要**: 以下所有带 `TODO` 标记的配置项必须替换为实际值

### 3.1 GitHub Secrets（在 GitHub 仓库配置）

| Secret 名称 | 说明 | 示例值 | 如何获取 |
|------------|------|-------|---------|
| `SERVER_HOST` | 服务器 IP 地址 | `192.168.1.100` | 云服务商控制台 |
| `SERVER_USER` | SSH 用户名 | `ubuntu` 或 `root` | 服务器登录用户 |
| `SERVER_SSH_KEY` | SSH 私钥（完整内容） | `-----BEGIN OPENSSH...` | 见下方生成方法 |

**生成 SSH 密钥**:
```bash
# 本地执行
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/snapmatch_deploy
ssh-copy-id -i ~/.ssh/snapmatch_deploy.pub your-user@your-server-ip
cat ~/.ssh/snapmatch_deploy  # 复制私钥内容到 GitHub Secrets
```

---

### 3.2 GitHub Actions 工作流文件

**文件**: `.github/workflows/deploy-production.yml`

| 行号 | 原值 | 替换为 | 说明 |
|-----|------|-------|------|
| 12 | `SITE_DOMAIN: www.thepexels.art` | `SITE_DOMAIN: 你的域名` | 1Panel 部署域名 |
| 145 | `NEXT_PUBLIC_ADMIN_BASE_URL: https://www.thepexels.art/admin` | `https://你的域名/admin` | Admin 后台地址 |
| 150 | `NEXT_PUBLIC_API_BASE_URL: https://www.thepexels.art/api` | `https://你的域名/api` | Backend API 地址 |

---

### 3.3 服务器配置文件

#### Nginx 配置文件

**文件**: `/etc/nginx/sites-available/snapmatch`（服务器上）

| 原值 | 替换为 | 说明 |
|------|-------|------|
| `www.example.com` | `你的实际域名` | 所有出现的地方 |

---

#### Backend 环境变量文件

**文件**: `/var/www/snapmatch/backend/.env.production`（服务器上）

| 变量名 | 示例值 | 替换为 | 如何生成/获取 |
|-------|-------|-------|-------------|
| `JWT_SECRET` | `your-generated-secret-here` | 随机密钥 | **推荐**: `openssl rand -hex 32`<br>或: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_ORIGIN` | `https://www.example.com` | 你的域名 | 前端访问地址 |
| `CLOUDBASE_ENV` | `your-env-id` | CloudBase 环境 ID | [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb) |
| `CLOUDBASE_SECRET_ID` | `AKID...` | 腾讯云密钥 ID | 腾讯云 → 访问管理 → 访问密钥 |
| `CLOUDBASE_SECRET_KEY` | `xxx...` | 腾讯云密钥 Key | 同上 |

---

## 4. 部署前准备

### 4.1 本地环境检查

```bash
# 确认 Git 仓库已推送到 GitHub
git remote -v

# 确认所有更改已提交
git status
```

---

### 4.2 云服务器准备

#### 服务器最低配置要求

| 资源 | 推荐配置 |
|------|---------|
| CPU | 2 核 |
| 内存 | 4GB |
| 硬盘 | 40GB |
| 带宽 | 5Mbps |
| 操作系统 | Ubuntu 20.04/22.04 |

#### 开放端口

| 端口 | 协议 | 用途 |
|-----|------|------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 3002 | TCP | Backend (内部) |

---

### 4.3 域名准备

1. **购买域名**（如未购买）
2. **配置 DNS 解析**:
   - A 记录: `www.yourdomain.com` → 服务器 IP
   - A 记录: `yourdomain.com` → 服务器 IP

3. **验证 DNS 生效**:
```bash
ping www.yourdomain.com
```

---

## 5. 详细部署步骤

### 步骤 1: 配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 3 个 Secrets:

   **Secret 1: SERVER_HOST**
   ```
   Name: SERVER_HOST
   Value: 你的服务器 IP（如 192.168.1.100）
   ```

   **Secret 2: SERVER_USER**
   ```
   Name: SERVER_USER
   Value: ubuntu  (或 root)
   ```

   **Secret 3: SERVER_SSH_KEY**
   ```
   Name: SERVER_SSH_KEY
   Value: (私钥完整内容，包括 -----BEGIN... 和 -----END...)
   ```

---

### 步骤 2: 准备服务器环境

SSH 登录到服务器后，逐步执行以下命令：

#### 2.1 安装必要软件

**⚠️ 重要说明**: 服务器**不需要**安装 Node.js 来运行应用

**为什么 Next.js 项目不需要 Node.js 运行时?**

这是因为本项目使用了 **Next.js 静态导出模式** (`output: 'export'`):

```
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 静态导出 vs 传统服务端渲染                    │
├─────────────────────────────────────────────────────────────────┤
│ 构建阶段 (GitHub Actions)      │   运行阶段 (生产服务器)         │
│ ─────────────────────────      │   ────────────────────        │
│ ✅ 需要 Node.js 20              │   ❌ 不需要 Node.js            │
│ ├─ Next.js 编译器运行           │   ├─ Nginx 提供静态文件        │
│ ├─ React 组件 → HTML            │   ├─ index.html              │
│ ├─ TypeScript → JavaScript      │   ├─ about.html              │
│ └─ 生成 out/ 目录               │   └─ _next/static/*.js       │
│                                │                               │
│ 💡 构建在 CI/CD 中完成          │   💡 运行时只需 Nginx          │
└─────────────────────────────────────────────────────────────────┘
```

**具体说明**:
- **Backend (NestJS)**: Docker 容器化，容器内已包含 Node.js 20 环境
- **Frontend (Web + Admin)**: 在 GitHub Actions 中预先构建为纯静态文件，部署到服务器后通过 Nginx 托管
- **工具命令**: 如需在服务器上生成 JWT_SECRET 等配置，可选择性安装 Node.js（或使用 OpenSSL 替代）

**关键配置** (已在代码中设置):
- `apps/web/next.config.mjs`: `output: 'export'`
- `apps/admin/next.config.ts`: `output: 'export'`

```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登录以生效
exit
# 重新 SSH 登录

# 验证 Docker
docker --version

# 安装 Nginx
sudo apt install nginx -y

# 验证 Nginx
nginx -v
```

**可选: 安装 Node.js（用于工具命令）**

如果您希望在服务器上直接生成 JWT_SECRET 等配置，可以安装 Node.js：

```bash
# 方法 1: 使用 NodeSource 仓库（推荐 Node.js 20 LTS）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v20.x.x
npm --version

# 方法 2: 使用 nvm（适合需要多版本管理的场景）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**如果不安装 Node.js，可以使用替代方案生成密钥**（见下文 2.3 配置环境变量）。

---

#### 2.2 创建部署目录

```bash
# 创建应用根目录
sudo mkdir -p /var/www/snapmatch
sudo chown -R $USER:$USER /var/www/snapmatch

# 创建子目录
mkdir -p /var/www/snapmatch/{web,admin,backend}

# 验证目录结构
tree -L 2 /var/www/snapmatch
```

---

#### 2.3 配置 Backend 环境变量

**⚠️ 安全提示**: 环境变量文件包含敏感信息，**永远不要**提交到 Git 仓库。

**操作流程**: 本地创建 → 本地填写 → 上传到服务器

**步骤 1: 在本地生成 JWT_SECRET 密钥**

选择以下任一方式生成 64 字符随机密钥：

**方法 1: 使用 OpenSSL（推荐）**
```bash
openssl rand -hex 32
# 输出示例: 4f2e8c9a1b3d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
```

**方法 2: 使用 Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 输出示例: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**步骤 2: 在本地创建并填写环境变量文件**

在项目根目录执行（本地）：

```bash
# 基于模板创建环境变量文件
cp apps/backend/.env.example apps/backend/.env.production
```

使用编辑器打开并填写（本地）：

```bash
# 使用你喜欢的编辑器
nano apps/backend/.env.production
# 或
code apps/backend/.env.production
```

**填写以下关键配置**（其他保持默认）:

```bash
NODE_ENV=production
PORT=3002

# JWT 配置（使用步骤 1 生成的密钥）
JWT_SECRET=<粘贴步骤1生成的64字符密钥>
JWT_EXPIRES_IN=12h
AUTH_REFRESH_TOKEN_TTL_DAYS=30

# CORS 配置
ADMIN_ORIGIN=https://<你的实际域名>

# CloudBase 配置（从腾讯云控制台获取）
CLOUDBASE_ENV=<环境ID>
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=<腾讯云密钥ID>
CLOUDBASE_SECRET_KEY=<腾讯云密钥Key>

# RBAC 数据模型（保持默认）
CLOUDBASE_MODEL_USERS=rbac_users
CLOUDBASE_MODEL_AUTH_SESSIONS=auth_sessions
CLOUDBASE_MODEL_RBAC_ROLES=rbac_roles
CLOUDBASE_MODEL_RBAC_PERMISSIONS=rbac_permissions
CLOUDBASE_MODEL_RBAC_ROLE_PERMISSIONS=rbac_role_permissions
CLOUDBASE_MODEL_RBAC_USER_ROLES=rbac_user_roles
```

**步骤 3: 上传到服务器**

```bash
# 上传到服务器临时目录
scp apps/backend/.env.production your-user@your-server-ip:/tmp/

# SSH 登录服务器
ssh your-user@your-server-ip

# 移动到目标位置
sudo mkdir -p /var/www/snapmatch/backend
sudo mv /tmp/.env.production /var/www/snapmatch/backend/

# 设置权限（仅所有者可读写）
sudo chmod 600 /var/www/snapmatch/backend/.env.production

# 验证文件存在
ls -la /var/www/snapmatch/backend/.env.production

# 退出 SSH
exit
```

**步骤 4: 删除本地文件（重要）**

```bash
# 回到本地，删除环境变量文件
rm apps/backend/.env.production

# 确认已删除
ls -la apps/backend/.env*
# 应该只显示 .env.example 和 .env.local（开发环境）
```

---

#### 2.4 配置 Nginx

```bash
# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/snapmatch
```

**粘贴以下内容（记得替换 `www.yourdomain.com`）**:

```nginx
server {
    listen 80;
    server_name TODO_替换为你的域名;  # 例如: www.example.com

    # Web 官网 (根路径)
    location / {
        root /var/www/snapmatch/web;
        try_files $uri $uri.html $uri/ =404;

        # Next.js 静态导出支持
        add_header Cache-Control "public, max-age=3600";
    }

    # Admin 后台 (/admin 路径)
    location /admin {
        alias /var/www/snapmatch/admin;
        try_files $uri $uri.html $uri/ /admin/index.html;

        # 管理后台缓存策略
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Backend API (代理到 Docker 容器)
    location /api/ {
        proxy_pass http://localhost:3002/;
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

    # 健康检查端点 (用于监控)
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}
```

**保存**: `Ctrl+O` → 回车 → `Ctrl+X`

**启用配置**:
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/snapmatch /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 验证状态
sudo systemctl status nginx
```

---

### 步骤 3: 修改 GitHub Actions 配置

在本地项目中修改 `.github/workflows/deploy-production.yml`:

```bash
# 打开文件
code .github/workflows/deploy-production.yml
```

**替换以下两处**:

```yaml
# 第 125 行
- name: 构建 Web 前端
  run: pnpm -C apps/web build
  env:
    NEXT_PUBLIC_ADMIN_BASE_URL: https://TODO_替换为你的域名/admin

# 第 129 行
- name: 构建 Admin 后台
  run: pnpm -C apps/admin build
  env:
    NEXT_PUBLIC_API_BASE_URL: https://TODO_替换为你的域名/api
```

**提交更改**:
```bash
git add .github/workflows/deploy-production.yml
git commit -m "chore: 更新部署配置为实际域名"
git push origin main
```

---

### 步骤 4: 触发首次部署

```bash
# 1. 确保所有更改已提交
git status

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送标签（触发自动部署）
git push origin v1.0.0

# 4. 查看部署进度
# 访问: https://github.com/你的用户名/snapmatch-platform/actions
```

---

### 步骤 5: 验证部署

#### 5.1 检查 GitHub Actions

1. 打开 GitHub 仓库 → **Actions** 标签页
2. 查看最新的 "Deploy to Production" 工作流
3. 确认所有步骤都显示绿色 ✅

---

#### 5.2 检查服务器状态

SSH 登录到服务器，执行：

```bash
# 检查 Backend 容器
docker ps | grep snapmatch-backend

# 查看容器日志
docker logs -f snapmatch-backend

# 检查 Nginx
sudo systemctl status nginx

# 检查部署目录
ls -la /var/www/snapmatch/web
ls -la /var/www/snapmatch/admin
```

---

#### 5.3 浏览器验证

访问以下地址：

| 地址 | 预期结果 |
|------|---------|
| `http://你的域名` | 显示 Web 官网首页 |
| `http://你的域名/admin` | 显示 Admin 后台登录页 |
| `http://你的域名/health` | 显示 JSON: `{"status":"ok",...}` |

---

### 步骤 6: 配置 HTTPS（生产环境必做）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 自动获取并配置 SSL 证书
sudo certbot --nginx -d 你的域名

# 示例:
# sudo certbot --nginx -d www.example.com

# 设置自动续期
sudo certbot renew --dry-run
```

**验证 HTTPS**:
```bash
# 访问 https://你的域名
# 应显示安全锁图标 🔒
```

---

## 6. 配置文件模板

### 6.1 服务器环境变量模板

**文件路径**: `/var/www/snapmatch/backend/.env.production`

```bash
# ========================================
# SnapMatch Backend 生产环境配置
# ========================================

# 运行环境
NODE_ENV=production
PORT=3002

# ========================================
# JWT 认证配置
# ========================================
# 生成方法: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=TODO_生成的32字节随机密钥
JWT_EXPIRES_IN=12h
AUTH_REFRESH_TOKEN_TTL_DAYS=30

# ========================================
# CORS 配置
# ========================================
ADMIN_ORIGIN=https://TODO_你的域名

# ========================================
# CloudBase 配置
# ========================================
# 环境 ID: 从腾讯云 CloudBase 控制台获取
CLOUDBASE_ENV=TODO_环境ID

# 区域（通常不需要修改）
CLOUDBASE_REGION=ap-shanghai

# API 密钥: 从腾讯云 -> 访问管理 -> 访问密钥获取
CLOUDBASE_SECRET_ID=TODO_密钥ID
CLOUDBASE_SECRET_KEY=TODO_密钥Key

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

---

### 6.2 Nginx 配置模板（HTTP）

**文件路径**: `/etc/nginx/sites-available/snapmatch`

```nginx
# ========================================
# SnapMatch Nginx 配置 (HTTP)
# ========================================

server {
    listen 80;
    server_name TODO_你的域名;  # 例如: www.example.com

    # ========================================
    # Web 官网 (根路径)
    # ========================================
    location / {
        root /var/www/snapmatch/web;
        try_files $uri $uri.html $uri/ =404;

        # Next.js 静态导出支持
        add_header Cache-Control "public, max-age=3600";
    }

    # ========================================
    # Admin 后台 (/admin 路径)
    # ========================================
    location /admin {
        alias /var/www/snapmatch/admin;
        try_files $uri $uri.html $uri/ /admin/index.html;

        # 管理后台缓存策略
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # ========================================
    # Backend API (代理到 Docker 容器)
    # ========================================
    location /api/ {
        proxy_pass http://localhost:3002/;
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

    # ========================================
    # 健康检查端点 (用于监控)
    # ========================================
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}
```

---

### 6.3 Nginx 配置模板（HTTPS）

**自动生成**: 执行 `sudo certbot --nginx -d 你的域名` 后自动生成

**生成后的配置示例**:

```nginx
server {
    server_name www.example.com;

    # ... (其他配置同上)

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/www.example.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/www.example.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP 重定向到 HTTPS
server {
    if ($host = www.example.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name www.example.com;
    return 404; # managed by Certbot
}
```

---

## 7. 日常使用流程

### 7.1 正常开发流程

```bash
# 1. 本地开发
pnpm dev

# 2. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin main

# 3. 创建 Pull Request (可选)
# PR 会自动触发代码质量检查

# 4. 合并到 main 分支
# 此时不会自动部署
```

---

### 7.2 发布新版本

```bash
# 1. 确认代码已合并到 main 分支
git checkout main
git pull origin main

# 2. 创建版本标签
git tag v1.1.0  # 版本号递增

# 3. 推送标签（触发自动部署）
git push origin v1.1.0

# 4. 查看部署进度
# 访问: https://github.com/你的用户名/snapmatch-platform/actions
```

---

### 7.3 版本号规范

遵循语义化版本 (Semantic Versioning):

| 版本类型 | 格式 | 说明 | 示例 |
|---------|------|------|------|
| 主版本 | `vX.0.0` | 不兼容的 API 修改 | `v2.0.0` |
| 次版本 | `vX.Y.0` | 新增功能，向下兼容 | `v1.1.0` |
| 补丁版本 | `vX.Y.Z` | Bug 修复 | `v1.1.1` |

---

### 7.4 查看部署历史

```bash
# 查看所有版本标签
git tag -l

# 查看特定版本的详情
git show v1.0.0

# 查看部署日志
# 访问 GitHub Actions 页面
```

---

## 8. 故障排查

### 8.1 部署失败

#### 问题: GitHub Actions 显示红色 ❌

**检查步骤**:

1. **查看错误日志**:
   - 打开 GitHub Actions → 点击失败的工作流 → 查看红色步骤的日志

2. **常见错误及解决方案**:

   | 错误信息 | 原因 | 解决方案 |
   |---------|------|---------|
   | `Permission denied` | SSH 密钥错误 | 检查 `SERVER_SSH_KEY` Secret |
   | `Connection refused` | 服务器无法连接 | 检查 `SERVER_HOST` 和防火墙 |
   | `Docker build failed` | Docker 构建失败 | 检查 Dockerfile 语法 |
   | `Health check failed` | Backend 启动失败 | 检查服务器 `.env.production` |

---

#### 问题: Backend 健康检查失败

**排查步骤**:

```bash
# SSH 登录服务器

# 1. 检查容器是否运行
docker ps -a | grep snapmatch-backend

# 2. 查看容器日志
docker logs snapmatch-backend

# 3. 检查环境变量文件
cat /var/www/snapmatch/backend/.env.production

# 4. 手动测试健康检查
curl http://localhost:3002/health

# 5. 重启容器
docker restart snapmatch-backend
```

---

### 8.2 访问问题

#### 问题: 无法访问网站

**排查步骤**:

```bash
# 1. 检查 DNS 解析
ping www.yourdomain.com

# 2. 检查 Nginx 状态
sudo systemctl status nginx

# 3. 检查 Nginx 配置
sudo nginx -t

# 4. 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 5. 检查防火墙
sudo ufw status
```

---

#### 问题: 404 Not Found

**可能原因**:

1. **前端文件未部署**:
   ```bash
   ls -la /var/www/snapmatch/web  # 检查文件是否存在
   ```

2. **Nginx 配置错误**:
   ```bash
   sudo nginx -t  # 测试配置
   ```

3. **路径配置错误**:
   - 检查 `apps/admin/next.config.ts` 中的 `basePath`

---

#### 问题: API 请求失败

**排查步骤**:

```bash
# 1. 检查 Backend 容器
docker ps | grep snapmatch-backend

# 2. 测试 Backend 健康检查
curl http://localhost:3002/health

# 3. 查看 Backend 日志
docker logs -f snapmatch-backend

# 4. 检查 Nginx 代理配置
sudo nginx -t
```

---

### 8.3 性能问题

#### 问题: 页面加载缓慢

**优化建议**:

1. **启用 Nginx Gzip 压缩**:
   ```nginx
   # 在 server 块中添加
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml;
   gzip_min_length 1000;
   ```

2. **配置浏览器缓存**:
   ```nginx
   # 静态资源缓存 1 年
   location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **启用 CDN**（可选）:
   - 使用阿里云/腾讯云 CDN 加速静态资源

---

### 8.4 快速回滚

#### 场景: 新版本有问题，需要回滚到上一版本

**方法 1: 重新部署旧版本标签**

```bash
# 本地执行
git tag v1.0.1-rollback v1.0.0  # 创建新标签指向旧版本
git push origin v1.0.1-rollback  # 触发重新部署
```

**方法 2: 服务器手动回滚 Backend**

```bash
# SSH 登录服务器

# 停止当前容器
docker stop snapmatch-backend
docker rm snapmatch-backend

# 启动旧版本镜像
docker run -d \
  --name snapmatch-backend \
  --restart unless-stopped \
  -p 3002:3000 \
  --env-file /var/www/snapmatch/backend/.env.production \
  snapmatch-backend:v1.0.0  # 指定旧版本标签
```

---

## 9. 性能优化建议

### 9.1 Nginx 优化

**编辑配置文件**: `/etc/nginx/nginx.conf`

```nginx
http {
    # 启用 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # 客户端缓冲区
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    # 超时设置
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    # 日志优化
    access_log /var/log/nginx/access.log combined buffer=512k flush=1m;
}
```

---

### 9.2 Docker 优化

**定期清理镜像**:

```bash
# 清理未使用的镜像和容器
docker system prune -a --force

# 定时任务（每周日凌晨 2 点）
crontab -e
# 添加: 0 2 * * 0 /usr/bin/docker system prune -f
```

---

### 9.3 监控与日志

#### 安装监控工具（可选）

```bash
# 安装 htop（系统监控）
sudo apt install htop -y

# 安装 ncdu（磁盘使用分析）
sudo apt install ncdu -y
```

#### 查看日志

```bash
# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# Backend 容器日志
docker logs -f --tail 100 snapmatch-backend

# 系统日志
journalctl -u nginx -f
```

---

## 10. 安全最佳实践

### 10.1 SSH 安全

```bash
# 禁用 root 密码登录
sudo nano /etc/ssh/sshd_config
# 设置: PermitRootLogin no
# 设置: PasswordAuthentication no

# 重启 SSH 服务
sudo systemctl restart sshd
```

---

### 10.2 防火墙配置

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 查看状态
sudo ufw status
```

---

### 10.3 自动更新

```bash
# 启用自动安全更新
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 11. 附录

### 11.1 常用命令速查

| 操作 | 命令 |
|------|------|
| 查看部署日志 | GitHub → Actions 页面 |
| 重启 Nginx | `sudo systemctl restart nginx` |
| 重启 Backend | `docker restart snapmatch-backend` |
| 查看容器日志 | `docker logs -f snapmatch-backend` |
| 测试健康检查 | `curl http://localhost:3002/health` |
| 清理 Docker | `docker system prune -a` |
| 查看磁盘使用 | `df -h` |
| 查看内存使用 | `free -h` |

---

### 11.2 联系支持

如遇问题无法解决，请：

1. 查看 GitHub Actions 日志
2. 查看服务器日志（Nginx、Docker）
3. 提交 Issue 到项目仓库

---

### 11.3 更新记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-12-28 | 初始版本 |

---

**文档结束** 🎉

> 祝部署顺利！如有问题欢迎随时反馈。
