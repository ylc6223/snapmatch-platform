# 部署问题排查指南

## 🔍 快速诊断

### 1. 检查 GitHub Actions 状态

访问以下链接查看部署日志：

```
https://github.com/ylc6223/snapmatch-platform/actions
```

**关键检查点：**

- ✅ 代码质量检查是否通过
- ✅ Backend 构建是否成功
- ✅ 前端构建是否成功
- ✅ 文件上传是否成功

---

## 🐛 常见问题排查

### 问题 1: Backend 部署失败导致前端未部署

**症状：**

- GitHub Actions 在 Backend 部署步骤失败
- Web 和 Admin 文件未部署到服务器

**原因：**

- Workflow 中 Backend 部署失败后整个 job 停止
- 前端部署步骤未执行

**排查步骤：**

#### 1.1 检查 Backend 容器状态

```bash
# SSH 登录服务器
ssh your-user@your-server

# 查看容器状态
sudo docker ps -a | grep snapmatch-backend

# 查看容器日志
sudo docker logs snapmatch-backend

# 检查健康状态
curl http://localhost:3002/health
```

**预期输出：**

```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "uptime": 123.45
}
```

#### 1.2 常见 Backend 错误

**错误 A: 容器立即退出**

```
Error response from daemon: No such container: snapmatch-backend
```

**解决方案：**

- 检查 `.env.production` 是否存在且配置正确
- 检查容器日志找出启动失败原因
- 验证 JWT_SECRET 是否设置且长度 >= 16

**错误 B: 健康检查失败**

```
curl: (7) Failed to connect to localhost port 3002
```

**解决方案：**

- 检查容器是否在运行：`sudo docker ps`
- 检查端口映射：`netstat -tlnp | grep 3002`
- 查看容器日志：`sudo docker logs snapmatch-backend`

---

### 问题 2: 前端文件未部署到服务器

**症状：**

- GitHub Actions 显示成功
- 服务器上 `/opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/` 目录为空或内容不正确

**排查步骤：**

#### 2.1 检查文件是否存在

```bash
# SSH 登录服务器
ssh your-user@your-server

# 检查 Web 文件
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/

# 检查 Admin 文件
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/admin/

# 统计文件数量
find /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/ -type f | wc -l
```

**预期输出：**

- Web 目录应包含：`index.html`, `_next/`, `images/` 等
- Admin 目录应包含：`index.html`, `_next/` 等
- 文件总数应该 > 20

#### 2.2 常见前端部署错误

**错误 A: 目录权限问题**

```bash
# 检查目录所有权
ls -ld /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/

# 应该显示：
# drwxr-xr-x ... www-data www-data ... www.thepexels.art/
```

**解决方案：**

```bash
# 修复权限
sudo chown -R www-data:www-data /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/
sudo chmod -R 755 /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/
```

**错误 B: 上传路径错误**

检查 GitHub Actions 日志中的上传路径：

```
source: 'apps/web/out/*'
target: '/opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/'
```

**错误 C: SSH 密钥权限问题**

GitHub Actions 日志显示：

```
Permission denied (publickey)
```

**解决方案：**

- 检查 GitHub Secrets 中 `SERVER_SSH_KEY` 是否正确
- 检查服务器 `~/.ssh/authorized_keys` 是否包含对应公钥

#### 2.3 验证文件内容

```bash
# 检查 index.html 是否包含正确内容
head -30 /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/index.html | grep "光影工作室"

# 应该输出包含 "光影工作室" 的行
```

---

### 问题 3: Admin 服务部署失败或无法访问

**症状：**

- GitHub Actions 显示 Admin 部署失败
- 或访问 `https://www.thepexels.art/admin/` 返回 502 Bad Gateway
- 或 PM2 显示 Admin 服务未运行

**原因：**

- Admin 使用 Standalone 模式，需要 Node.js 运行时
- PM2 服务未启动或启动失败
- 端口 3001 被占用
- OpenResty 反向代理配置错误

**排查步骤：**

#### 3.1 检查 PM2 服务状态

```bash
# 检查 PM2 进程
pm2 status snapmatch-admin

# 查看详细日志
pm2 logs snapmatch-admin --lines 100

# 查看错误日志
cat /opt/1panel/apps/snapmatch/admin/logs/error.log
```

**常见错误 A: PM2 进程不存在**

```
Process snapmatch-admin not found
```

**解决方案：**

```bash
cd /opt/1panel/apps/snapmatch/admin
pm2 start ecosystem.config.js
pm2 save
```

**常见错误 B: 服务启动后立即退出**

PM2 状态显示 `errored` 或 `stopped`。

**解决方案：**

```bash
# 查看详细错误
pm2 logs snapmatch-admin --err --lines 50

# 常见原因：
# 1. server.js 文件不存在或路径错误
ls -la /opt/1panel/apps/snapmatch/admin/apps/admin/server.js

# 2. Node.js 版本不兼容
node --version  # 应该 >= 20

# 3. 缺少依赖文件
ls -la /opt/1panel/apps/snapmatch/admin/apps/admin/.next/
```

**常见错误 C: 端口被占用**

日志显示：`Error: listen EADDRINUSE: address already in use :::3001`

**解决方案：**

```bash
# 查找占用端口的进程
netstat -tlnp | grep 3001
# 或
lsof -i :3001

# 停止占用进程
kill -9 <PID>

# 重启 Admin 服务
pm2 restart snapmatch-admin
```

#### 3.2 检查 OpenResty 反向代理配置

```bash
# 查看配置文件
cat /opt/1panel/apps/openresty/openresty/conf/conf.d/www.thepexels.art.conf | grep -A 10 "location /admin"

# 测试配置
sudo docker exec 1panel-openresty openresty -t

# 查看 OpenResty 错误日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.error.log
```

**预期配置：**

```nginx
location /admin {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    # ... 其他 headers
}
```

#### 3.3 验证服务可访问性

```bash
# 1. 测试本地端口
curl -I http://localhost:3001/admin/

# 2. 测试通过反向代理
curl -I http://localhost/admin/

# 3. 测试公网访问
curl -I https://www.thepexels.art/admin/
```

---

### 问题 4: 访问网站返回 404 或空白页

**症状：**

- 文件已部署到服务器
- 访问 `https://www.thepexels.art/` 返回 404 或空白页

**排查步骤：**

#### 3.1 检查 OpenResty/Nginx 配置

```bash
# 查看配置文件
cat /opt/1panel/apps/openresty/openresty/conf/conf.d/www.thepexels.art.conf

# 测试配置是否有效
sudo docker exec 1panel-openresty openresty -t

# 重载配置
sudo docker exec 1panel-openresty openresty -s reload
```

**关键配置检查：**

```nginx
server {
    server_name www.thepexels.art;

    # 检查 root 或 alias 路径是否正确
    location / {
        root /www/sites/www.thepexels.art/index;
        try_files $uri $uri.html $uri/ /index.html;
    }

    location /admin {
        alias /www/sites/www.thepexels.art/admin;
        try_files $uri $uri.html $uri/ /admin/index.html;
    }
}
```

#### 3.2 检查 OpenResty 日志

```bash
# 访问日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.access.log

# 错误日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.error.log
```

---

## 🛠️ 手动部署脚本

如果 GitHub Actions 持续失败，使用手动部署脚本：

```bash
# 在本地项目根目录执行
SERVER_HOST=your-server-ip ./scripts/manual-deploy.sh
```

**脚本功能：**

1. 构建 Web 和 Admin
2. 清理远程旧文件
3. 上传新文件
4. 设置正确权限

---

## 📊 GitHub Actions Workflow 依赖关系

**v1.0.8+ 架构（当前）：**

```
quality-check (Lint + TypeScript + Test)
    ↓ (失败则停止所有部署)
    ├─→ deploy-backend (独立 job)
    │     └── Backend Docker 容器构建 + 部署
    │
    ├─→ deploy-web (独立 job)
    │     └── Web 静态文件构建 + 部署
    │
    └─→ deploy-admin (独立 job)
          └── Admin Standalone 构建 + PM2 部署

    ↓ (所有部署完成后)
notify (汇总部署结果)
```

**重要说明：**

- ✅ 三个部署 job 互相独立，一个失败不影响其他
- ✅ Backend、Web、Admin 可以独立部署和验证
- ⚠️ Admin 需要 Node.js 运行时环境（PM2 管理）
- ⚠️ 如果 quality-check 失败，所有部署都不会执行

**v1.0.7 之前架构（已废弃）：**

```
quality-check
    ↓
build-and-deploy (单个 job)
    ├── Backend 部署 ❌ 失败阻止后续步骤
    ├── Web 部署
    └── Admin 部署
```

---

## 🔧 调试技巧

### 1. 在 GitHub Actions 中添加调试输出

临时在 workflow 中添加调试步骤：

```yaml
- name: 调试 - 列出构建产物
  run: |
    ls -la apps/web/out/
    ls -la apps/admin/out/
    find apps/web/out/ -type f | head -10
```

### 2. 在服务器上验证上传

```bash
# 查看最近上传的文件
find /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/ -type f -mmin -10

# 查看文件时间戳
ls -lt /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/ | head -20
```

### 3. 测试 SSH 连接

```bash
# 从本地测试 SSH 连接
ssh -i ~/.ssh/your-key your-user@your-server "ls -la /opt/1panel/apps/openresty/openresty/www/sites/"
```

---

## 📋 部署检查清单

部署完成后，按照以下清单验证：

### Backend

- [ ] Docker 容器运行中：`sudo docker ps | grep snapmatch-backend`
- [ ] 健康检查通过：`curl http://localhost:3002/health`
- [ ] 日志无错误：`sudo docker logs snapmatch-backend`

### Web 官网

- [ ] 文件已部署：`ls -la /opt/.../www.thepexels.art/index/index.html`
- [ ] 内容正确：`grep "光影工作室" /opt/.../www.thepexels.art/index/index.html`
- [ ] 可访问：`curl https://www.thepexels.art/`

### Admin 后台（Node.js 服务）

- [ ] PM2 进程运行中：`pm2 status snapmatch-admin`
- [ ] 服务监听 3001 端口：`netstat -tlnp | grep 3001`
- [ ] 本地可访问：`curl http://localhost:3001/admin/`
- [ ] 公网可访问：`curl https://www.thepexels.art/admin/`
- [ ] 日志无错误：`pm2 logs snapmatch-admin --lines 50 --nostream`

### Web 官网权限

- [ ] 文件所有权正确：`www-data:www-data`
- [ ] 文件权限正确：`755` (目录) / `644` (文件)

---

## 🆘 紧急恢复

如果部署完全失败，按以下步骤恢复：

### 1. 回滚到上一个可用版本

```bash
# 在服务器上
cd /opt/1panel/apps/openresty/openresty/www/sites/
sudo cp -r www.thepexels.art www.thepexels.art.backup

# 从备份恢复（如果有）
# sudo cp -r www.thepexels.art.backup.v1.0.5 www.thepexels.art
```

### 2. 使用手动部署脚本

```bash
# 本地
git checkout v1.0.5  # 回到上一个稳定版本
SERVER_HOST=your-server-ip ./scripts/manual-deploy.sh
```

### 3. 联系团队

如果以上方法都无法解决，收集以下信息联系技术团队：

- GitHub Actions 日志截图
- 服务器错误日志
- Docker 容器日志
- 网站访问错误截图

---

## 📚 相关文档

- [部署访问配置](./DEPLOYMENT_ACCESS.md) - 域名访问配置
- [IP 访问配置](./DEPLOYMENT_IP_ACCESS.md) - IP 访问配置
- [变更日志](../CHANGELOG.md) - 版本变更历史
