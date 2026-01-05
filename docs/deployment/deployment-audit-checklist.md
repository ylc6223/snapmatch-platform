# 部署审查清单与执行指南

> 本文档用于在生产环境部署前进行全面审查，确保部署顺利进行。

**最后更新**: 2026-01-05
**当前版本**: v1.0.21
**待发布版本**: v1.1.0
**距离上次部署**: 130 次提交

---

## 📊 一、当前状态分析

### 基本信息

| 项目            | 版本  | 部署方式             | 端口   |
| --------------- | ----- | -------------------- | ------ |
| **Web 官网**    | 0.1.0 | 静态文件 (OpenResty) | 80/443 |
| **Admin 后台**  | 0.5.9 | PM2 (Node.js)        | 3001   |
| **Backend API** | 0.1.0 | Docker 容器          | 3002   |

### 环境配置

| 环境               | Node.js     | pnpm    |
| ------------------ | ----------- | ------- |
| **本地开发**       | v22.18.0 ⚠️ | 10.15.0 |
| **GitHub Actions** | v20 ✅      | 10      |
| **Dockerfile**     | v20 ✅      | -       |

> ⚠️ **注意**: 本地 Node 版本与 CI 不一致，建议统一为 v20

### 重大变更积累 (130 个提交)

- ✨ 数据分析页面复刻 (lumina-admin 数据概览)
- ✨ 前后端数据联动和共享类型包
- ✨ 项目搜索功能实现
- ✨ 选片系统与照片交付模块
- 🔨 用户角色字段统一重构
- 🔨 TypeScript 类型错误修复
- 🔨 端口隔离改进

---

## ⚠️ 二、发现的关键问题

### 🔴 高危问题

1. **Node.js 版本不一致**
   - 本地: v22.18.0
   - CI/Docker: v20
   - **影响**: 本地可能无法复现 CI 环境问题
   - **修复**: 创建 `.nvmrc` 文件指定版本

2. **数据库 Schema 变更**
   - 130 个提交中可能包含数据库结构变更
   - **需要**: 检查是否需要迁移脚本
   - **验证**: `find apps/backend -name "*migration*" -o -name "*schema*"`

### 🟡 中危问题

1. **域名未备案**
   - 文档说明: "由于域名尚未备案，这里域名改为使用ip访问"
   - **影响**: 需要在多个地方配置 IP 地址

2. **环境变量管理**
   - Backend 需要 `.env.production` 文件
   - 当前硬编码在 workflow 中

---

## ✅ 三、部署前检查清单

### Phase 1: 本地代码质量验证

在本地执行以下命令，确保代码可以正常构建：

```bash
# 1. 切换到 Node 20 (与 CI 保持一致)
nvm install 20
nvm use 20

# 2. 清理并重新安装依赖
rm -rf node_modules apps/*/node_modules
pnpm install

# 3. 运行所有检查 (模拟 CI)
pnpm lint              # Lint 检查
pnpm build             # 构建所有应用
pnpm -C apps/backend test  # 后端测试

# 4. 本地验证构建产物
ls -la apps/web/out/                        # Web 静态文件
ls -la apps/admin/.next/standalone/         # Admin standalone
ls -la apps/backend/dist/                   # Backend 构建

# 5. 检查构建产物大小
du -sh apps/web/out/
du -sh apps/admin/.next/standalone/
du -sh apps/backend/dist/
```

**预期结果**:

- ✅ 所有 lint 检查通过
- ✅ TypeScript 类型检查无错误
- ✅ 后端单元测试通过
- ✅ 构建成功且产物大小合理

---

### Phase 2: GitHub Secrets 配置检查

> 📖 **详细配置指南**: 参考 [GitHub Secrets 配置指南](./github-secrets-setup-guide.md)

在 GitHub Repository Settings → Secrets and variables → Actions 中确认以下 Secrets：

#### 必需的 Secrets (部署必须)

| Secret 名称      | 说明                        | 示例值                                                       | 必需 |
| ---------------- | --------------------------- | ------------------------------------------------------------ | ---- |
| `SERVER_HOST`    | 服务器 IP 或域名            | `123.45.67.89`                                               | ✅   |
| `SERVER_USER`    | SSH 登录用户名              | `ubuntu` 或 `root`                                           | ✅   |
| `SERVER_SSH_KEY` | SSH 私钥内容                | `-----BEGIN OPENSSH PRIVATE KEY-----...`                     | ✅   |
| `SITE_DOMAIN`    | **网站域名或 IP** (新增)    | `www.thepexels.art` 或 `123.45.67.89`                        | ✅   |
| `API_BASE_URL`   | **Backend API 地址** (新增) | `https://www.thepexels.art/api` 或 `http://123.45.67.89/api` | ✅   |

#### 配置说明

**如果域名已备案**:

```yaml
SITE_DOMAIN: www.thepexels.art
API_BASE_URL: https://www.thepexels.art/api
```

**如果域名未备案 (使用 IP)**:

```yaml
SITE_DOMAIN: 123.45.67.89
API_BASE_URL: http://123.45.67.89/api
```

**⚠️ 重要提示**:

- `SITE_DOMAIN` 和 `API_BASE_URL` 是**新增必需**的 Secrets
- 如果不配置，Workflow 会使用默认值 (`www.thepexels.art`)，可能导致部署失败
- 详细配置步骤请参考: [GitHub Secrets 配置指南](./github-secrets-setup-guide.md)

**验证方法**:

```bash
# 在 GitHub 仓库页面:
Settings → Secrets and variables → Actions

# 或直接访问:
https://github.com/你的用户名/snapmatch-platform/settings/secrets/actions
```

---

### Phase 3: 服务器环境检查

SSH 登录到服务器后执行以下检查：

```bash
# 1. 检查 Docker
docker --version
docker ps

# 2. 检查 PM2 (Admin 需要)
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 --version"
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 list"

# 3. 检查 Node.js 版本
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; node --version"

# 4. 检查 1Panel + OpenResty 路径
ls -la /opt/1panel/apps/openresty/openresty/www/sites/

# 5. 检查当前部署状态
sudo docker ps | grep snapmatch
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 status"
```

**预期结果**:

- ✅ Docker 已安装且运行正常
- ✅ PM2 已安装 (v5.30.0+)
- ✅ Node.js v20 已安装
- ✅ OpenResty 路径存在

---

### Phase 4: Backend 环境变量配置

**服务器上必须创建**:

```bash
sudo mkdir -p /opt/1panel/apps/snapmatch/backend
sudo vim /opt/1panel/apps/snapmatch/backend/.env.production
```

**文件内容示例** (参考 `apps/backend/.env.production.example`):

```bash
# 服务配置
PORT=3000
NODE_ENV=production

# Admin CORS 配置
ADMIN_ORIGIN=https://www.thepexels.art
# 如果域名未备案，使用 IP:
# ADMIN_ORIGIN=http://your-server-ip

# JWT 认证
JWT_SECRET=your-random-secret-key-min-32-chars
JWT_EXPIRES_IN=12h

# Refresh Token TTL
AUTH_REFRESH_TOKEN_TTL_DAYS=30

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=snapmatch_user
DB_PASSWORD=your-secure-password
DB_DATABASE=snapmatch
# DB_SSL=true  # 如果数据库需要 SSL

# (可选) 预设管理员密码哈希
# 生成方法: node -e "console.log(require('bcryptjs').hashSync('password', 10))"
# SEED_ADMIN_PASSWORD_HASH=
# SEED_VISITOR_PASSWORD_HASH=
```

**验证方法**:

```bash
# 检查文件是否存在且内容正确
cat /opt/1panel/apps/snapmatch/backend/.env.production

# 确保文件权限正确
sudo chmod 600 /opt/1panel/apps/snapmatch/backend/.env.production
sudo ls -la /opt/1panel/apps/snapmatch/backend/.env.production
```

---

### Phase 5: 数据库配置检查

**如果 130 个提交中包含数据库 schema 变更，需要执行迁移**:

```bash
# 1. 备份当前数据库
mysqldump -u root -p snapmatch > snapmatch_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 检查是否有迁移文件
find apps/backend -name "*migration*" -o -name "*schema*"

# 3. 如果有迁移脚本，手动执行
# mysql -u root -p snapmatch < migration_script.sql

# 4. 验证数据库结构
mysql -u root -p -e "USE snapmatch; SHOW TABLES;"
```

---

## 🚀 四、推荐部署方案

### 方案 A: 完整部署流程 (推荐)

#### Step 1: 本地预验证

```bash
# 1. 切换到 Node 20
nvm install 20 && nvm use 20

# 2. 清理并重新安装
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# 3. 完整构建测试
pnpm build

# 4. 运行测试
pnpm -C apps/backend test

# 5. 检查构建产物
du -sh apps/web/out/
du -sh apps/admin/.next/standalone/
du -sh apps/backend/dist/
```

---

#### Step 2: 统一 Node.js 版本

创建 `.nvmrc` 文件：

```bash
echo "20" > .nvmrc
cat .nvmrc
```

**更新 README.md** (在开发环境设置部分添加):

````markdown
## 环境要求

- Node.js: **v20** (严格版本，与 CI 保持一致)
- pnpm: v10
- Docker: v20+ (用于 Backend 容器化)

**安装 Node.js v20**:

```bash
# 使用 nvm
nvm install 20
nvm use 20

# 验证版本
node --version  # 应该输出 v20.x.x
```
````

````

---

#### Step 3: 优化 GitHub Actions (可选)

**修改 `.github/workflows/deploy-production.yml`**:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:  # ✅ 添加手动触发，方便测试

env:
  NODE_VERSION: 20
  PNPM_VERSION: 10
  # ✅ 使用 secrets 而不是硬编码
  SITE_DOMAIN: ${{ secrets.SITE_DOMAIN || 'www.thepexels.art' }}
  PANEL_BASE_PATH: /opt/1panel/apps/openresty/openresty/www/sites
````

**修改 Admin 部署环境变量** (第 293 行):

```yaml
- name: 构建 Admin (Standalone 模式)
  run: pnpm -C apps/admin build
  env:
    # ✅ 使用 secrets 或保持当前配置
    NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL || 'https://www.thepexels.art/api' }}
```

**注意**: 如果使用 secrets，需要在 GitHub 中添加相应的 secret。

---

#### Step 4: 创建并推送 Tag

```bash
# 1. 查看当前最新 commit
git log -1 --oneline

# 2. 创建新 tag (建议版本号: v1.1.0)
git tag -a v1.1.0 -m "Release v1.1.0: 数据分析、搜索、选片系统"

# 3. 推送 tag (先不推送代码)
git push origin v1.1.0

# 4. 如果需要推送代码
git push origin main
```

---

#### Step 5: 监控 GitHub Actions

```bash
# 在 GitHub 上查看 Actions 运行状态:
# https://github.com/你的用户名/snapmatch-platform/actions
```

**关键检查点**:

1. ✅ quality-check job 通过
2. ✅ deploy-backend 成功
3. ✅ deploy-web 成功
4. ✅ deploy-admin 成功
5. ✅ 健康检查全部通过

**如果失败，查看日志**:

- 点击失败的 job
- 展开失败的 step
- 查看详细错误信息

---

#### Step 6: 服务器验证部署

等待 Actions 完成后，SSH 登录服务器执行验证：

```bash
# 1. Backend 容器
sudo docker ps | grep snapmatch-backend
sudo docker logs snapmatch-backend --tail 50
curl http://localhost:3002/health

# 2. Admin PM2 进程
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 status"
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 logs snapmatch-admin --lines 50"
curl http://localhost:3001/admin/

# 3. Web 静态文件
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/
# 如果使用 IP:
ls -la /opt/1panel/apps/openresty/openresty/www/sites/your-server-ip/index/
```

**预期结果**:

```
# Backend
✅ snapmatch-backend 容器运行中
✅ 健康检查返回 200
✅ 日志无 ERROR 级别信息

# Admin
✅ snapmatch-admin 进程 online
✅ PM2 显示 status: "online"
✅ 日志无错误信息

# Web
✅ out/ 目录存在且包含静态文件
✅ index.html 存在
```

---

#### Step 7: 浏览器验证

```
# 如果域名已备案
1. Web: https://www.thepexels.art/
2. Admin: https://www.thepexels.art/admin/
3. API: https://www.thepexels.art/api/health

# 如果域名未备案，使用 IP
1. Web: http://your-server-ip/
2. Admin: http://your-server-ip/admin/
3. API: http://your-server-ip/api/health
```

**测试清单**:

- [ ] Web 首页可以访问
- [ ] Admin 登录页面可以访问
- [ ] Admin 可以登录
- [ ] Admin 数据加载正常
- [ ] API 健康检查返回 200
- [ ] 浏览器控制台无错误

---

### 方案 B: 灰度测试 (谨慎推荐)

如果担心 130 个提交的风险，可以先部署到测试环境。

#### Step 1: 创建测试分支

```bash
git checkout -b deploy-test-v1.1.0
git push origin deploy-test-v1.1.0
```

#### Step 2: 修改 workflow 支持测试分支

在 `.github/workflows/deploy-production.yml` 中添加:

```yaml
on:
  push:
    tags:
      - 'v*'
    branches:
      - deploy-test-* # ✅ 允许测试分支触发
  workflow_dispatch:
```

#### Step 3: 手动触发或推送触发

```bash
# 推送测试分支会自动触发部署
git push origin deploy-test-v1.1.0

# 或在 GitHub Actions 页面手动运行
```

#### Step 4: 测试通过后再正式部署

```bash
# 切换回 main 分支
git checkout main

# 创建正式 tag
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

---

## 🔄 五、回滚方案

如果部署失败，可以快速回滚到上一个版本。

### 方式 1: Git Tag 回滚

```bash
# 1. 回滚到上一个 tag
git checkout v1.0.21
git push origin v1.0.21

# 2. 触发部署 (自动运行)
# 或手动触发 workflow_dispatch
```

### 方式 2: 服务器手动回滚

```bash
# ===== Backend 回滚 =====
sudo docker stop snapmatch-backend
sudo docker rm snapmatch-backend

# 如果有旧镜像
sudo docker images | grep snapmatch-backend
sudo docker run -d \
  --name snapmatch-backend \
  --restart unless-stopped \
  -p 3002:3000 \
  --env-file /opt/1panel/apps/snapmatch/backend/.env.production \
  -e PORT=3000 \
  -e NODE_ENV=production \
  snapmatch-backend:v1.0.21

# ===== Admin 回滚 =====
cd /opt/1panel/apps/snapmatch/admin

# 备份当前版本
tar -czf admin-backup-$(date +%Y%m%d).tar.gz *

# 解压旧版本 (需要提前备份或重新上传)
# tar -xzf admin-standalone-v1.0.21.tar.gz

# 重启 PM2
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 restart snapmatch-admin"

# ===== Web 回滚 =====
# 从备份恢复或重新上传旧的 out/ 目录
sudo rsync -avz /backup/web-out/ /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/
```

### 方式 3: 数据库回滚

```bash
# 如果有数据库备份
mysql -u root -p snapmatch < snapmatch_backup_YYYYMMDD_HHMMSS.sql
```

---

## 📊 六、监控与日志

### Backend 日志

```bash
# 实时查看
sudo docker logs -f snapmatch-backend

# 查看最近 100 行
sudo docker logs --tail 100 snapmatch-backend

# 查看特定时间段
sudo docker logs --since 30m snapmatch-backend
```

### Admin 日志

```bash
# 实时查看
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 logs snapmatch-admin"

# 查看最近 50 行
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 logs snapmatch-admin --lines 50"

# 查看错误日志
tail -f /opt/1panel/apps/snapmatch/admin/logs/error.log
```

### Web 访问日志

```bash
# OpenResty 访问日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.access.log

# 错误日志
tail -f /opt/1panel/apps/openresty/openresty/logs/www.thepexels.art.error.log
```

### 系统资源监控

```bash
# CPU/内存
htop

# 磁盘使用
df -h

# Docker 资源
sudo docker stats

# PM2 监控
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 monit"
```

---

## 📋 七、快速执行清单

### 部署前必做 (必须全部完成)

- [ ] 切换到 Node 20 (`nvm use 20`)
- [ ] 本地 `pnpm install` 成功
- [ ] 本地 `pnpm build` 成功
- [ ] 本地 `pnpm -C apps/backend test` 通过
- [ ] 确认服务器 `/opt/1panel/apps/snapmatch/backend/.env.production` 存在
- [ ] 确认 GitHub Secrets 配置完整
- [ ] 确认数据库配置正确
- [ ] (可选) 备份当前生产环境
- [ ] (可选) 备份数据库

### 部署执行步骤

```bash
# 1. 切换到 Node 20
nvm use 20

# 2. 验证本地构建
pnpm install
pnpm build

# 3. 创建 tag
git tag -a v1.1.0 -m "Release v1.1.0: 数据分析、搜索、选片系统"

# 4. 推送 tag
git push origin v1.1.0

# 5. 监控 Actions
# 在 GitHub 上查看 workflow 运行状态

# 6. 等待完成并验证 (5-10分钟)
```

### 部署后验证 (必须全部通过)

- [ ] GitHub Actions 所有 job 成功
- [ ] Backend 容器运行 (`sudo docker ps`)
- [ ] Backend 健康检查通过 (`curl http://localhost:3002/health`)
- [ ] Admin PM2 进程在线 (`pm2 status`)
- [ ] Admin 页面可访问 (`curl http://localhost:3001/admin/`)
- [ ] Web 静态文件部署正确
- [ ] 浏览器访问所有页面正常
- [ ] 浏览器控制台无错误
- [ ] Admin 功能测试通过 (登录、数据加载等)

---

## 🔧 八、常见问题排查

### 问题 1: GitHub Actions 失败 - "rsync not found"

**原因**: GitHub Actions runner 环境异常

**解决方案**:

- 通常是临时问题，重新运行 workflow
- 如果持续失败，检查 workflow 中的 rsync 检测逻辑

### 问题 2: Backend 健康检查失败

**排查步骤**:

```bash
# 1. 查看容器日志
sudo docker logs snapmatch-backend

# 2. 检查环境变量
sudo docker exec snapmatch-backend env | grep -E "PORT|NODE_ENV|DB_"

# 3. 进入容器检查
sudo docker exec -it snapmatch-backend sh

# 4. 手动测试健康检查
curl http://localhost:3002/health
```

**常见原因**:

- `.env.production` 文件不存在或配置错误
- 数据库连接失败
- 端口冲突

### 问题 3: Admin PM2 启动失败

**排查步骤**:

```bash
# 1. 查看 PM2 日志
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; pm2 logs snapmatch-admin --lines 100"

# 2. 检查 Node.js 版本
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; node --version"

# 3. 手动启动测试
cd /opt/1panel/apps/snapmatch/admin
sudo bash -lc "export NVM_DIR=/root/.nvm; source \$NVM_DIR/nvm.sh; node apps/admin/server.js"
```

**常见原因**:

- Node.js 版本不匹配
- 依赖缺失 (standalone 打包问题)
- 端口 3001 被占用

### 问题 4: Web 404 Not Found

**排查步骤**:

```bash
# 1. 检查静态文件是否存在
ls -la /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/

# 2. 检查文件权限
sudo chown -R www-data:www-data /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/
sudo chmod -R 755 /opt/1panel/apps/openresty/openresty/www/sites/www.thepexels.art/index/

# 3. 检查 OpenResty 配置
# 在 1Panel 面板中检查站点配置
```

### 问题 5: 数据库连接失败

**排查步骤**:

```bash
# 1. 测试数据库连接
mysql -h localhost -u snapmatch_user -p snapmatch

# 2. 检查环境变量
sudo docker exec snapmatch-backend env | grep DB_

# 3. 查看 Backend 日志
sudo docker logs snapmatch-backend | grep -i "database\|mysql\|connection"
```

---

## 💡 九、优化建议

### 1. 添加自动化测试

在 `quality-check` job 中添加端到端测试：

```yaml
- name: E2E 测试
  run: pnpm -C apps/e2e test
```

### 2. 添加部署通知

在 `notify` job 中添加钉钉/企业微信通知：

```yaml
- name: 发送钉钉通知
  if: always()
  uses: 1arryosc/send-dingtalk-notification@main
  with:
    token: ${{ secrets.DINGTALK_TOKEN }}
    type: markdown
    content: |
      ## 部署通知
      - 环境: Production
      - 版本: ${{ github.ref_name }}
      - 状态: ${{ job.status }}
```

### 3. 添加性能监控

集成 Sentry 或其他性能监控工具。

### 4. 数据库迁移自动化

创建数据库迁移脚本和自动化执行流程。

### 5. 添加回滚按钮

在 workflow 中添加 `rollback` job，支持一键回滚。

---

## 📚 十、相关文档

- [部署访问配置](./access.md)
- [GitHub Secrets 配置指南](./github-secrets-setup-guide.md) ⭐ **新增**
- [部署审查清单](./deployment-audit-checklist.md) (本文档)
- [Backend 环境变量示例](../../apps/backend/.env.production.example)
- [项目 README](../../README.md)

---

## 📞 十一、联系与支持

如果遇到本文档未覆盖的问题：

1. 查看 GitHub Actions 日志
2. 查看服务器日志 (Backend/Admin/Web)
3. 在项目 Issues 中提问
4. 联系技术负责人

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-05
**维护者**: SnapMatch Team
