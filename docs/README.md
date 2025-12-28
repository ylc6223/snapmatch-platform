# 📦 部署文档导航

本目录包含 SnapMatch 平台的完整部署指南和工具。

---

## 📚 文档列表

### 1️⃣ [部署完整指南](./deployment-guide.md) 📖 **标准 Nginx 部署**

**用途**: 详细的标准 Nginx 部署教程（**不使用 1Panel**）

**内容**:
- 部署架构概览
- 文件结构说明
- 配置替换清单
- 详细部署步骤（6 个阶段）
- 手动配置 Nginx
- 配置文件模板
- 日常使用流程
- 故障排查指南
- 性能优化建议

**适合**:
- 全新服务器，未安装任何面板
- 需要完全控制服务器配置的开发者
- 熟悉 Linux 和 Nginx 的用户

**⚠️ 注意**: 如果服务器已安装 1Panel，建议使用 [1Panel 部署指南](./deployment-1panel.md)

---

### 2️⃣ [部署检查清单](./deployment-checklist.md) ⭐ **推荐打印**

**用途**: 快速核对所有配置项是否已正确替换

**内容**:
- **选择部署方式** - 标准 Nginx 或 1Panel（新增）
- GitHub Secrets 配置检查（3 项）
- GitHub Actions 文件检查（2 处替换）
- 服务器环境检查（3 项）
- Backend 环境变量检查（12 项）
- Nginx 配置检查
- DNS 配置检查
- 安全配置检查
- 部署验证清单（12 项）

**适合**: 部署前快速核对，避免遗漏配置

---

### 3️⃣ [1Panel 部署指南](./deployment-1panel.md) ⭐ **推荐使用**

**用途**: 专为已安装 1Panel 面板的服务器提供的部署指南

**内容**:
- 1Panel 与标准部署的差异对比
- **部署路径**: `/opt/1panel/apps/openresty/openresty/www/sites/{域名}/`
- **Backend 配置**: `/opt/1panel/apps/snapmatch/backend/.env.production`
- 通过 Web 界面配置网站、反向代理、SSL 证书
- 1Panel 特有的运维操作（日志查看、配置修改）
- 常见问题排查（1Panel 专属）

**优势**:
- ✅ 可视化配置，无需手动编辑配置文件
- ✅ 一键申请 Let's Encrypt SSL 证书
- ✅ 自动证书续期
- ✅ 方便的日志查看和管理

**适合**: 服务器已安装 1Panel 面板的用户（**推荐大多数用户使用**）

---

## 🛠️ 脚本工具

### [服务器配置脚本](../scripts/server-setup.sh)

**用途**: 一键在云服务器上配置部署环境

**功能**:
- ✅ 自动更新系统
- ✅ 安装 Docker
- ✅ 安装 Nginx（标准部署）
- ✅ 创建部署目录结构
- ✅ 生成 Nginx 配置模板（标准部署）

**⚠️ 注意**: 此脚本仅适用于标准 Nginx 部署，1Panel 用户无需使用

**使用方法**:

```bash
# 1. 上传到服务器
scp scripts/server-setup.sh user@server-ip:~/

# 2. SSH 登录服务器并执行
ssh user@server-ip
chmod +x server-setup.sh
./server-setup.sh
```

---

## 🚀 快速开始

### 对于首次部署

**选择标准 Nginx 部署**:
1. **阅读完整指南** → [deployment-guide.md](./deployment-guide.md)
2. **准备配置清单** → 打印或在副屏显示 [deployment-checklist.md](./deployment-checklist.md)
3. **执行服务器配置脚本** → [server-setup.sh](../scripts/server-setup.sh)
4. **按清单逐项核对** → 确保所有配置项已替换
5. **触发部署** → `git tag v1.0.0 && git push origin v1.0.0`

**选择 1Panel 部署** ⭐ 推荐:
1. **阅读 1Panel 指南** → [deployment-1panel.md](./deployment-1panel.md)
2. **准备配置清单** → 打印或在副屏显示 [deployment-checklist.md](./deployment-checklist.md)（选择 1Panel 选项）
3. **创建部署目录和配置** → 参考指南中的环境准备步骤
4. **通过 1Panel 配置** → Web 界面配置网站、反向代理、SSL
5. **触发部署** → `git tag v1.0.0 && git push origin v1.0.0`

---

### 对于已部署项目

- **日常发布**: 参考 [deployment-guide.md § 7. 日常使用流程](./deployment-guide.md#7-日常使用流程)
- **故障排查**: 参考 [deployment-guide.md § 8. 故障排查](./deployment-guide.md#8-故障排查)
- **性能优化**: 参考 [deployment-guide.md § 9. 性能优化建议](./deployment-guide.md#9-性能优化建议)

---

## 📋 必须替换的配置项汇总

> ⚠️ 以下所有配置项必须替换为实际值才能正常部署

### GitHub 配置

| 位置 | 原值 | 需替换为 |
|------|------|---------|
| GitHub Secrets | `SERVER_HOST` | 服务器 IP |
| GitHub Secrets | `SERVER_USER` | SSH 用户名 |
| GitHub Secrets | `SERVER_SSH_KEY` | SSH 私钥完整内容 |
| `.github/workflows/deploy-production.yml:12` | `SITE_DOMAIN: www.thepexels.art` | 你的域名 |
| `.github/workflows/deploy-production.yml:145` | `NEXT_PUBLIC_ADMIN_BASE_URL` | 你的域名/admin |
| `.github/workflows/deploy-production.yml:150` | `NEXT_PUBLIC_API_BASE_URL` | 你的域名/api |

### 服务器配置

**⚠️ 重要**: 环境变量文件应在本地创建、填写后上传到服务器，不要提交到 Git

| 配置文件 | 路径（1Panel） | 路径（标准 Nginx） | 需替换配置 |
|---------|---------------|-------------------|-----------|
| Backend 环境变量 | `/opt/1panel/apps/snapmatch/backend/.env.production` | `/var/www/snapmatch/backend/.env.production` | JWT_SECRET、ADMIN_ORIGIN、CLOUDBASE_ENV、CLOUDBASE_SECRET_ID、CLOUDBASE_SECRET_KEY |
| Nginx 配置 | 通过 1Panel Web 界面配置 | `/etc/nginx/sites-available/snapmatch` | server_name（域名） |

---

## 🔧 常用命令速查

### 本地操作

```bash
# 提交代码
git add .
git commit -m "feat: 新功能"
git push origin main

# 创建版本标签并部署
git tag v1.0.0
git push origin v1.0.0

# 查看部署进度
# 访问: https://github.com/你的用户名/snapmatch-platform/actions
```

### 服务器操作

```bash
# 查看 Backend 容器状态
docker ps | grep snapmatch-backend

# 查看 Backend 日志
docker logs -f snapmatch-backend

# 重启 Backend
docker restart snapmatch-backend

# 测试健康检查
curl http://localhost:3002/health

# 查看部署文件（1Panel）
ls -la /opt/1panel/apps/openresty/openresty/www/sites/你的域名/

# 查看部署文件（标准 Nginx）
ls -la /var/www/snapmatch/{web,admin}

# 查看 Nginx 状态
sudo systemctl status nginx

# 重启 Nginx（标准 Nginx）
sudo systemctl restart nginx

# 重启 Nginx（1Panel - 使用 Web 界面或命令）
docker restart openresty
```

---

## 🆘 获取帮助

### 遇到问题？

1. **查看检查清单** → 确认所有配置项已勾选
2. **查看完整文档** → 特别是 [故障排查章节](./deployment-guide.md#8-故障排查)
3. **查看日志**:
   - GitHub Actions: `https://github.com/你的用户名/snapmatch-platform/actions`
   - Backend: `docker logs -f snapmatch-backend`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

### 常见问题快速索引

- [部署失败](./deployment-guide.md#81-部署失败)
- [无法访问网站](./deployment-guide.md#82-访问问题)
- [404 Not Found](./deployment-guide.md#问题-404-not-found)
- [API 请求失败](./deployment-guide.md#问题-api-请求失败)
- [快速回滚](./deployment-guide.md#84-快速回滚)

---

## 📊 文档版本

| 文档 | 版本 | 更新日期 |
|------|------|---------|
| deployment-guide.md | v1.0.0 | 2025-12-28 |
| deployment-1panel.md | v1.0.0 | 2025-12-28 |
| deployment-checklist.md | v1.0.0 | 2025-12-28 |
| server-setup.sh | v1.0.0 | 2025-12-28 |

---

## 📝 反馈与改进

如发现文档问题或有改进建议，请：
1. 提交 Issue 到 GitHub 仓库
2. 或直接提交 PR 改进文档

---

**祝部署顺利！** 🎉
