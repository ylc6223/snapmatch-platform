# 🔧 SnapMatch 部署配置检查清单

> **用途**: 在开始部署前，使用此清单确保所有配置项已正确替换
> **建议**: 打印此清单或在副屏显示，逐项核对

---

## 📋 阶段 1: GitHub 配置

### 1.1 GitHub Secrets（必须配置）

- [ ] **SERVER_HOST** - 服务器 IP 地址
  - [ ] 已从云服务商控制台获取
  - [ ] 已添加到 GitHub Secrets
  - [ ] 值格式: `192.168.1.100`（示例）

- [ ] **SERVER_USER** - SSH 用户名
  - [ ] 已确认用户名（通常是 `ubuntu` 或 `root`）
  - [ ] 已添加到 GitHub Secrets
  - [ ] 值格式: `ubuntu` 或 `root`

- [ ] **SERVER_SSH_KEY** - SSH 私钥
  - [ ] 已生成 SSH 密钥对: `ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/snapmatch_deploy`
  - [ ] 已将公钥添加到服务器: `ssh-copy-id -i ~/.ssh/snapmatch_deploy.pub user@server-ip`
  - [ ] 已复制私钥完整内容: `cat ~/.ssh/snapmatch_deploy`
  - [ ] 已添加到 GitHub Secrets
  - [ ] 值包含 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`

---

### 1.2 GitHub Actions 工作流文件

**文件**: `.github/workflows/deploy-production.yml`

- [ ] **第 125 行** - Web 前端构建环境变量
  - 原值: `NEXT_PUBLIC_ADMIN_BASE_URL: https://www.example.com/admin`
  - 替换为: `NEXT_PUBLIC_ADMIN_BASE_URL: https://你的域名/admin`
  - [ ] 已替换并保存

- [ ] **第 129 行** - Admin 后台构建环境变量
  - 原值: `NEXT_PUBLIC_API_BASE_URL: https://www.example.com/api`
  - 替换为: `NEXT_PUBLIC_API_BASE_URL: https://你的域名/api`
  - [ ] 已替换并保存

- [ ] **已提交更改**
  ```bash
  git add .github/workflows/deploy-production.yml
  git commit -m "chore: 更新部署配置为实际域名"
  git push origin main
  ```

---

## 🖥️ 阶段 2: 服务器配置

### 2.0 选择部署方式 ⚡ **重要**

**请根据您的服务器环境选择对应的部署方式**:

- [ ] **选项 A: 标准 Nginx 部署**（推荐新用户）
  - 适用: 全新服务器，未安装任何面板
  - 优势: 完全控制，配置透明
  - 文档: 继续使用本清单
  - 参考: [deployment-guide.md](./deployment-guide.md)

- [ ] **选项 B: 1Panel 面板部署**（推荐已有 1Panel 用户）
  - 适用: 服务器已安装 1Panel 面板
  - 优势: 可视化配置，操作简单，一键 SSL
  - **部署目录**: 仍使用 `/var/www/snapmatch`（无需更改）
  - **Nginx 配置**: 通过 1Panel Web 界面配置（无需手动编辑配置文件）
  - **专属文档**: 📖 [deployment-1panel.md](./deployment-1panel.md) ⭐ **推荐阅读**

**⚠️ 重要说明**:
- **部署目录不变**: 无论选择哪种方式，部署目录都是 `/var/www/snapmatch`
- **GitHub Actions 不变**: 自动部署流程完全相同
- **主要区别**: 仅在 Nginx 配置方式上不同（手动编辑 vs Web 界面）

**如果您选择了"选项 B: 1Panel 部署"，请跳转到**:
👉 [deployment-1panel.md](./deployment-1panel.md) - 1Panel 专属部署指南

---

### 2.1 服务器基础环境（标准 Nginx 部署）

> **注意**: 如果您选择了 1Panel 部署，请跳过此章节，参考 [deployment-1panel.md](./deployment-1panel.md)

- [ ] **Docker 已安装**
  - [ ] 执行: `curl -fsSL https://get.docker.com | sh`
  - [ ] 执行: `sudo usermod -aG docker $USER`
  - [ ] 重新登录后验证: `docker --version`

- [ ] **Nginx 已安装**
  - [ ] 执行: `sudo apt install nginx -y`
  - [ ] 验证: `nginx -v`

- [ ] **部署目录已创建**（1Panel 用户跳过此步骤）

  **⚠️ 注意**:
  - **1Panel 用户**: 1Panel 会自动创建站点目录，路径为 `/opt/1panel/apps/openresty/openresty/www/sites/{你的域名}/`
  - **标准 Nginx 用户**: 需要手动创建 `/var/www/snapmatch` 目录

  **标准 Nginx 部署**（仅非 1Panel 用户）:
  - [ ] 执行: `sudo mkdir -p /var/www/snapmatch && sudo chown -R $USER:$USER /var/www/snapmatch`
  - [ ] 执行: `mkdir -p /var/www/snapmatch/{web,admin,backend}`
  - [ ] 验证: `ls -la /var/www/snapmatch`

- [ ] **Node.js 已安装（可选）**

  ⚠️ **注意**: 服务器**不需要** Node.js 来运行应用
  - Backend 在 Docker 容器内运行（已包含 Node.js 20）
  - Frontend 是静态文件（Nginx 托管，无需 Node.js）
  - **仅用于工具命令**（如生成 JWT_SECRET）
  - [ ] 如需安装: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
  - [ ] 验证: `node --version`
  - [ ] **推荐使用 OpenSSL 替代**: `openssl rand -hex 32` 生成 JWT_SECRET

---

### 2.1.1 Docker 故障排查（可选）

<details>
<summary><strong>⚠️ 如果 Docker 安装失败，点击展开查看解决方案（腾讯云用户）</strong></summary>

> **适用环境**: 腾讯云 CVM（云服务器）Ubuntu 20.04/22.04

#### 问题 1: Docker 安装脚本失败

**错误现象**:
```bash
curl -fsSL https://get.docker.com | sh
# 提示: Could not connect to get.docker.com
# 或: Connection timed out
```

**原因分析**:
- 腾讯云 CVM 默认 DNS 可能无法访问某些国外域名
- 网络限制导致下载失败

**解决方案（腾讯云推荐）**:

**方法 1: 使用腾讯云镜像源安装**
```bash
# 卸载旧版本（如有）
sudo apt remove docker docker-engine docker.io containerd runc

# 更新软件包索引
sudo apt update

# 安装依赖
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加腾讯云 Docker 镜像源（推荐）
curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新并安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 验证安装
docker --version
```

**方法 2: 使用阿里云镜像源（备选）**
```bash
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

**常见问题速查表**:

| 问题 | 快速解决 |
|------|---------|
| 安装失败 | 使用腾讯云镜像源: `mirrors.cloud.tencent.com` |
| 权限错误 | `sudo usermod -aG docker $USER && newgrp docker` |
| 镜像下载慢 | 配置镜像加速: `mirror.ccs.tencentyun.com` |
| daemon 启动失败 | `sudo systemctl restart containerd && sudo systemctl restart docker` |
| 容器无法访问外网 | 检查安全组出站规则 + `sysctl net.ipv4.ip_forward=1` |
| 重启后容器未启动 | `docker update --restart unless-stopped <容器名>` |
| 磁盘空间不足 | `docker system prune -a` |

</details>

---

### 2.2 Backend 环境变量配置

**⚠️ 安全提示**: 环境变量文件包含敏感信息，**永远不要**提交到 Git 仓库。

**文件位置**: `/opt/1panel/apps/snapmatch/backend/.env.production`

**配置步骤**:

1. **在本地创建环境变量文件**（基于模板）:
   ```bash
   # 在项目根目录执行
   cp apps/backend/.env.example apps/backend/.env.production
   ```

2. **编辑配置文件**（本地）:
   ```bash
   # 使用你喜欢的编辑器打开
   nano apps/backend/.env.production
   # 或
   code apps/backend/.env.production
   ```

3. **填写以下关键配置**:

   - [ ] **JWT_SECRET** - JWT 签名密钥
     ```bash
     # 生成密钥（本地执行）
     openssl rand -hex 32
     ```
     - [ ] 已生成 64 字符的随机密钥
     - [ ] 已替换文件中的 `change-me`

   - [ ] **ADMIN_ORIGIN** - 管理后台域名
     - [ ] 已修改为: `https://www.thepexels.art`（替换为你的实际域名）

   - [ ] **CLOUDBASE_ENV** - CloudBase 环境 ID
     - [ ] 已从 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) 获取
     - [ ] 已填写（格式: `env-xxxxxxxx`）

   - [ ] **CLOUDBASE_SECRET_ID** - 腾讯云 API 密钥 ID
     - [ ] 已从 [腾讯云访问管理](https://console.cloud.tencent.com/cam/capi) 获取
     - [ ] 已填写（格式: `AKIDxxxxxxxxxxxxxxxx`）

   - [ ] **CLOUDBASE_SECRET_KEY** - 腾讯云 API 密钥 Key
     - [ ] 已从 [腾讯云访问管理](https://console.cloud.tencent.com/cam/capi) 获取
     - [ ] 已填写（40 字符）

4. **上传到服务器**:
   ```bash
   # SSH 上传方式 1: 使用 scp
   scp apps/backend/.env.production user@server-ip:/tmp/

   # 然后 SSH 登录服务器移动文件
   ssh user@server-ip
   sudo mkdir -p /opt/1panel/apps/snapmatch/backend
   sudo mv /tmp/.env.production /opt/1panel/apps/snapmatch/backend/
   sudo chmod 600 /opt/1panel/apps/snapmatch/backend/.env.production
   ```

   或使用 SFTP/FTP 工具上传到 `/opt/1panel/apps/snapmatch/backend/.env.production`

5. **验证配置**（在服务器上）:
   ```bash
   # 检查文件是否存在
   ls -la /opt/1panel/apps/snapmatch/backend/.env.production

   # 检查关键配置是否已填写
   sudo cat /opt/1panel/apps/snapmatch/backend/.env.production | grep "JWT_SECRET="
   ```

**✅ 配置检查清单**:
- [ ] 已基于 .env.example 创建 .env.production
- [ ] JWT_SECRET 已填写（64 字符）
- [ ] ADMIN_ORIGIN 已填写（https://你的域名）
- [ ] CLOUDBASE_ENV 已填写（env-xxxxxxxx）
- [ ] CLOUDBASE_SECRET_ID 已填写（AKID 开头）
- [ ] CLOUDBASE_SECRET_KEY 已填写（40 字符）
- [ ] 已上传到服务器指定路径
- [ ] 文件权限已设置（chmod 600）
- [ ] ❗ .env.production 未提交到 Git（已在 .gitignore 中）

---

### 2.3 Nginx / 反向代理配置

**⚠️ 根据部署方式选择**:

- **1Panel 用户**:
  - ✅ 通过 1Panel Web 界面配置（无需手动编辑文件）
  - 📖 参考: [deployment-1panel.md](./deployment-1panel.md) - "步骤 3: 配置网站和反向代理"

- **标准 Nginx 用户**:
  - 📝 需要手动编辑 Nginx 配置文件
  - 📖 参考: [deployment-guide.md](./deployment-guide.md) - 完整 Nginx 配置示例

---

## 🌐 阶段 3: DNS 配置

- [ ] **域名已购买**

- [ ] **DNS A 记录已配置**
  - [ ] `www.yourdomain.com` → 服务器 IP
  - [ ] `yourdomain.com` → 服务器 IP（可选）

- [ ] **DNS 解析已生效**
  - [ ] 执行: `ping www.yourdomain.com`
  - [ ] 返回正确的服务器 IP

---

## 🔒 阶段 4: 安全配置

### 4.1 防火墙

- [ ] **UFW 防火墙已配置**
  - [ ] 执行: `sudo ufw allow 22/tcp`（SSH）
  - [ ] 执行: `sudo ufw allow 80/tcp`（HTTP）
  - [ ] 执行: `sudo ufw allow 443/tcp`（HTTPS）
  - [ ] 执行: `sudo ufw enable`

- [ ] **云服务商安全组已配置**
  - [ ] 已在云服务商控制台开放端口 22、80、443

---

### 4.2 HTTPS 证书（生产环境推荐）

- [ ] **Certbot 已安装**
  - [ ] 执行: `sudo apt install certbot python3-certbot-nginx -y`

- [ ] **SSL 证书已获取**
  - [ ] 执行: `sudo certbot --nginx -d www.yourdomain.com`
  - [ ] 证书自动续期已测试: `sudo certbot renew --dry-run`

---

## 🚀 阶段 5: 部署验证

### 第一次部署后检查

- [ ] **GitHub Actions 工作流成功**
  - [ ] 访问 `https://github.com/你的用户名/snapmatch-platform/actions`
  - [ ] 最新的 "Deploy to Production" 工作流显示绿色 ✅

- [ ] **Backend 容器运行正常**
  - [ ] 执行: `docker ps | grep snapmatch-backend`
  - [ ] 容器状态: `Up`

- [ ] **健康检查通过**
  - [ ] 执行: `curl http://localhost:3002/health`
  - [ ] 返回: `{"status":"ok",...}`

- [ ] **Nginx 运行正常**
  - [ ] 执行: `sudo systemctl status nginx`
  - [ ] 状态: `active (running)`

- [ ] **Web 官网可访问**
  - [ ] 浏览器访问: `http://www.yourdomain.com`
  - [ ] 显示官网首页

- [ ] **Admin 后台可访问**
  - [ ] 浏览器访问: `http://www.yourdomain.com/admin`
  - [ ] 显示管理后台登录页

- [ ] **API 健康检查可访问**
  - [ ] 浏览器访问: `http://www.yourdomain.com/health`
  - [ ] 返回 JSON: `{"status":"ok",...}`

- [ ] **HTTPS 已启用**（如已配置）
  - [ ] 浏览器访问: `https://www.yourdomain.com`
  - [ ] 显示安全锁图标 🔒

---

## 📝 快速核对表

**使用方法**: 复制到剪贴板，逐项填写 ✅

```
[ ] 1. GitHub Secrets 已配置（SERVER_HOST、SERVER_USER、SERVER_SSH_KEY）
[ ] 2. GitHub Actions 工作流文件已替换域名（2 处）
[ ] 3. 服务器 Docker 已安装
[ ] 4. 服务器 Nginx 已安装
[ ] 5. 服务器部署目录已创建
[ ] 6. 服务器 Backend 环境变量已配置（共 12 项）
[ ] 7. 服务器 Nginx 配置已创建并启用
[ ] 8. DNS 解析已配置并生效
[ ] 9. 防火墙已配置（端口 22、80、443）
[ ] 10. 首次部署已执行（git tag + push）
[ ] 11. 部署验证已通过（8 项检查）
[ ] 12. HTTPS 证书已配置（生产环境推荐）
```

---

## 🔍 常见遗漏项

> 部署前请特别注意以下容易遗漏的配置：

1. ❌ **忘记生成 JWT_SECRET**
   - 解决（推荐）: `openssl rand -hex 32`
   - 或: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. ❌ **SSH 私钥未包含完整内容**
   - 解决: 确保包含 `-----BEGIN...-----` 和 `-----END...-----`

3. ❌ **Nginx 配置中域名未替换**
   - 解决: 搜索配置文件中的 `TODO_替换为你的域名`

4. ❌ **环境变量文件权限过大**
   - 解决: `chmod 600 /var/www/snapmatch/backend/.env.production`

5. ❌ **防火墙未开放端口**
   - 解决: 云服务商控制台 + UFW 都要配置

6. ❌ **DNS 解析未生效就开始部署**
   - 解决: `ping www.yourdomain.com` 确认解析正确

7. ❌ **GitHub Actions 环境变量未替换**
   - 解决: 检查 `.github/workflows/deploy-production.yml` 第 125、129 行

---

## 📞 获取帮助

如遇问题，请按以下顺序排查：

1. **查看本清单** - 确认所有项已勾选
2. **查看完整文档** - `docs/deployment-guide.md`
3. **查看 GitHub Actions 日志** - GitHub → Actions 页面
4. **查看服务器日志**:
   ```bash
   docker logs -f snapmatch-backend  # Backend 日志
   sudo tail -f /var/log/nginx/error.log  # Nginx 日志
   ```

---

**核对完成日期**: ________________

**核对人**: ________________

**部署结果**: [ ] 成功 [ ] 失败（原因: ________________）
