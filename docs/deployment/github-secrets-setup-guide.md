# GitHub Secrets 配置指南

> 本指南详细说明如何在 GitHub Repository 中配置 Secrets，用于管理部署环境变量。

**最后更新**: 2026-01-05

---

## 📋 概述

### 为什么使用 GitHub Secrets？

**之前的问题** (硬编码):

- ❌ 域名/IP 地址写死在 workflow 代码中
- ❌ 每次切换环境需要修改代码并提交
- ❌ 敏感信息暴露在公开的代码仓库中
- ❌ 不同环境（开发/测试/生产）无法灵活配置

**使用 Secrets 后**:

- ✅ 配置与代码分离
- ✅ 安全性更高（敏感信息不暴露在代码中）
- ✅ 灵活性强（不同环境使用不同配置）
- ✅ 可维护性好（切换环境无需修改代码）

---

## 🚀 快速配置步骤

### Step 1: 打开 GitHub Secrets 配置页面

**方式 1: 直接访问 URL**

```
https://github.com/你的用户名/snapmatch-platform/settings/secrets/actions
```

**方式 2: 通过界面操作**

1. 打开 GitHub Repository 页面
2. 点击 **Settings** (设置)
3. 左侧菜单找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮

---

### Step 2: 添加必需的 Secrets

需要添加以下 2 个 Secrets：

#### Secret 1: `SITE_DOMAIN`

| 字段      | 值                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------ |
| **Name**  | `SITE_DOMAIN`                                                                                          |
| **Value** | **如果域名已备案**: `www.thepexels.art`<br>**如果域名未备案**: `your-server-ip` (例如: `123.45.67.89`) |
| **说明**  | Web 静态文件部署的域名或服务器 IP                                                                      |

**示例值**:

- 域名已备案: `www.thepexels.art`
- 使用 IP: `123.45.67.89`
- 使用域名带端口: `www.thepexels.art:8080`

---

#### Secret 2: `API_BASE_URL`

| 字段      | 值                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------ | --- |
| **Name**  | `API_BASE_URL`                                                                                         |
| **Value** | **如果域名已备案**: `https://www.thepexels.art/api`<br>**如果域名未备案**: `http://your-server-ip/api` |     |
| **说明**  | Admin 前端请求 Backend API 的地址                                                                      |

**示例值**:

- 域名已备案 (HTTPS): `https://www.thepexels.art/api`
- 域名未备案 (HTTP + IP): `http://123.45.67.89/api`
- 本地开发: `http://localhost:3002/api`

**⚠️ 注意**:

- 如果使用 IP，协议通常是 `http` (没有 SSL 证书)
- 如果使用域名且已备案，协议应该是 `https`

---

### Step 3: 验证配置

添加完成后，在 Secrets 页面应该能看到：

```
Actions secrets
├── SITE_DOMAIN            (Updated at 2026-01-05 10:30)
└── API_BASE_URL           (Updated at 2026-01-05 10:30)
```

---

## 🔐 完整的 Secrets 列表

### 必需的 Secrets (部署必须)

| Secret 名称      | 说明             | 示例值                                   | 必需    |
| ---------------- | ---------------- | ---------------------------------------- | ------- |
| `SERVER_HOST`    | 服务器 IP 或域名 | `123.45.67.89`                           | ✅      |
| `SERVER_USER`    | SSH 登录用户名   | `ubuntu` 或 `root`                       | ✅      |
| `SERVER_SSH_KEY` | SSH 私钥内容     | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅      |
| `SITE_DOMAIN`    | 网站域名或 IP    | `www.thepexels.art` 或 `123.45.67.89`    | ✅ 新增 |
| `API_BASE_URL`   | Backend API 地址 | `https://www.thepexels.art/api`          | ✅ 新增 |

### 可选的 Secrets (增强功能)

| Secret 名称            | 说明                      | 示例值                                                  | 必需 |
| ---------------------- | ------------------------- | ------------------------------------------------------- | ---- |
| `NOTIFICATION_WEBHOOK` | 钉钉/企业微信通知 Webhook | `https://oapi.dingtalk.com/robot/send?access_token=...` | ⚠️   |
| `ROLLBAR_ACCESS_TOKEN` | 错误监控 Token            | `your-rollbar-token`                                    | ⚠️   |

---

## 📝 配置示例

### 场景 1: 域名已备案 (生产环境)

```yaml
SITE_DOMAIN: www.thepexels.art
API_BASE_URL: https://www.thepexels.art/api
```

**部署后的访问地址**:

- Web: `https://www.thepexels.art/`
- Admin: `https://www.thepexels.art/admin/`
- API: `https://www.thepexels.art/api/`

---

### 场景 2: 域名未备案，使用 IP (当前环境)

```yaml
SITE_DOMAIN: 123.45.67.89
API_BASE_URL: http://123.45.67.89/api
```

**部署后的访问地址**:

- Web: `http://123.45.67.89/`
- Admin: `http://123.45.67.89/admin/`
- API: `http://123.45.67.89/api/`

**⚠️ 注意**:

- 使用 IP 时协议是 `http` (没有 HTTPS)
- 浏览器可能会提示"不安全"（正常现象）

---

### 场景 3: 多环境配置 (开发/测试/生产)

如果需要支持多个环境，可以创建不同的 workflow 或使用 Environment：

**方式 1: 使用不同的分支**

- `main` 分支 → 使用生产环境配置
- `dev` 分支 → 使用开发环境配置

**方式 2: 使用 GitHub Environment** (推荐)

```
Settings → Environments → New environment

创建 3 个环境:
1. development (开发环境)
2. staging (测试环境)
3. production (生产环境)
```

每个环境配置不同的 variables:

- `development`: `SITE_DOMAIN = dev.example.com`
- `staging`: `SITE_DOMAIN = staging.example.com`
- `production`: `SITE_DOMAIN = www.example.com`

---

## 🔄 Secrets 使用位置

### 在 Workflow 中的使用

**位置 1: 全局环境变量** (第 8-14 行)

```yaml
env:
  NODE_VERSION: 20
  PNPM_VERSION: 10
  SITE_DOMAIN: ${{ secrets.SITE_DOMAIN || 'www.thepexels.art' }}
  PANEL_BASE_PATH: /opt/1panel/apps/openresty/openresty/www/sites
```

**用途**:

- Web 静态文件部署路径: `/opt/1panel/apps/.../www/sites/${SITE_DOMAIN}/index`

---

**位置 2: Admin 构建环境变量** (第 291-294 行)

```yaml
- name: 构建 Admin (Standalone 模式)
  run: pnpm -C apps/admin build
  env:
    NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL || 'https://www.thepexels.art/api' }}
```

**用途**:

- Admin 前端构建时写入 API 地址
- Admin 在浏览器中请求 Backend API 时使用此地址

---

## ✅ 配置验证

### 方法 1: 查看 Workflow 日志

```bash
# 在 GitHub Actions 日志中查找
# Run: 构建 Admin (Standalone 模式)
# 应该能看到:
# NEXT_PUBLIC_API_BASE_URL=http://your-ip/api
```

### 方法 2: 测试部署

```bash
# 1. 创建测试 tag
git tag -a v1.1.0-test -m "Test deployment with secrets"
git push origin v1.1.0-test

# 2. 查看 Actions 运行日志
# 确认 SITE_DOMAIN 和 API_BASE_URL 正确读取
```

### 方法 3: 浏览器验证

部署成功后，打开浏览器开发者工具 (F12) → Network，查看 Admin 发起的 API 请求：

**应该看到**:

```
Request URL: http://your-ip/api/...
```

**如果还是旧地址**:

- 检查 Secret `API_BASE_URL` 是否配置正确
- 清除浏览器缓存并重新构建

---

## 🛠️ 常见问题排查

### 问题 1: Secret 未生效

**症状**: Workflow 运行时仍使用默认值 (`www.thepexels.art`)

**排查**:

1. 检查 Secret 名称是否正确 (区分大小写)
2. 检查 Workflow 语法: `${{ secrets.SITE_DOMAIN }}`
3. 重新运行 Workflow

**解决**:

```bash
# 确认 Secret 名称完全一致
# SITE_DOMAIN ≠ site_domain ≠ Site_Domain
```

---

### 问题 2: 跨域错误 (CORS)

**症状**: Admin 访问 API 时浏览器报 CORS 错误

**原因**: Backend 的 `ADMIN_ORIGIN` 环境变量配置不匹配

**解决**:

```bash
# 服务器上修改 Backend 环境变量
sudo vim /opt/1panel/apps/snapmatch/backend/.env.production

# 修改为与 API_BASE_URL 协议+域名一致 (去掉 /api)
ADMIN_ORIGIN=http://123.45.67.89

# 或
ADMIN_ORIGIN=https://www.thepexels.art

# 重启 Backend 容器
sudo docker restart snapmatch-backend
```

---

### 问题 3: HTTP 混合内容错误

**症状**: HTTPS 页面请求 HTTP API 被阻止

**原因**: 域名已备案使用 HTTPS，但 API_BASE_URL 配置为 HTTP

**解决**:

```yaml
# 修改 Secret
API_BASE_URL: https://www.thepexels.art/api # 使用 https
```

---

### 问题 4: Secret 配置后部署失败

**症状**: 配置 Secret 后 Workflow 失败

**排查步骤**:

1. 检查 Secret 值是否包含多余空格
2. 检查 URL 格式是否正确
3. 查看 Workflow 详细日志

**解决**:

```bash
# Secret 值应该:
✅ 正确: www.thepexels.art
✅ 正确: http://123.45.67.89/api

❌ 错误: www.thepexels.art (后面有空格)
❌ 错误: http://123.45.67.89/api/ (末尾不要 /)
```

---

## 📊 Secrets 管理

### 更新 Secret

如果需要修改 Secret 值：

1. 打开 Secrets 页面
2. 点击 Secret 名称
3. 点击 **Update** 按钮
4. 修改值并保存
5. **注意**: 已运行的 Workflow 不会自动更新，需要重新触发

### 删除 Secret

1. 打开 Secrets 页面
2. 点击 Secret 名称
3. 点击 **Delete** 按钮
4. 确认删除

**⚠️ 警告**: 删除 Secret 后，使用该 Secret 的 Workflow 会失败！

---

## 🔒 安全最佳实践

### 1. 最小权限原则

- 只配置必需的 Secrets
- 不要配置不需要的敏感信息

### 2. 定期轮换

- 定期更换 SSH 密钥
- 定期更换敏感 Token

### 3. 访问控制

- 在 GitHub Settings → Branches 中配置保护规则
- 限制谁能修改 Secrets (仅 Admin)

### 4. 审计日志

- 定期查看 Secrets 的使用情况
- Settings → Actions → General → Audit log

---

## 📚 相关文档

- [部署审查清单](./deployment-audit-checklist.md)
- [部署访问配置](./access.md)
- [GitHub 官方文档: Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看本文档的"常见问题排查"部分
3. 在项目 Issues 中提问

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-05
**维护者**: SnapMatch Team
