# SnapMatch Platform (Monorepo)

本仓库用于承载「一拍即合 / SnapMatch」的 **官网（Web）** 与 **管理后台（Admin）**，采用 Monorepo 目录结构，便于统一管理与未来扩展。

## 目录结构

- `apps/web`：摄影工作室官网（Next.js）
- `apps/admin`：管理后台（Next.js）
- `apps/backend`：后台 API（NestJS，JWT + 权限控制）
- `packages/*`：预留给共享组件/工具库
- `docs/`：项目文档
  - 📚 **[文档索引](docs/README.md)** - 全部文档入口（部署 / Admin / Backend / 规范）
- `scripts/server-setup.sh`：服务器环境一键配置脚本

## 本地开发

> 推荐使用 `pnpm`。

### 一键启动（推荐：避免多个 worktree 端口冲突）

```bash
pnpm dev:worktree
```

更多说明见：`docs/guides/worktree-dev.md`。

### 分别启动（可手动指定端口）

```bash
# 启动 Web 官网（默认端口 3000，可用 PORT 覆盖）
pnpm -C apps/web dev

# 启动 Admin 后台（默认端口 3001，可用 PORT 覆盖）
pnpm -C apps/admin dev

# 启动 Backend API（默认端口 3002，可用 PORT 覆盖）
pnpm -C apps/backend dev
```

也可以在仓库根目录运行：

```bash
# 同时启动所有应用
pnpm dev
```

> 多个 worktree 并行时，优先用 `pnpm dev:worktree`；如需手动运行不同端口，参考 `docs/guides/worktree-dev.md` 的变量说明。

## 🚀 部署指南

### 部署方式选择

本项目支持两种部署方式，**部署目录保持一致**（`/var/www/snapmatch`），主要区别在于 Nginx 配置方式：

#### 📋 标准 Nginx 部署（推荐新用户）

- **适用**: 全新服务器，未安装任何面板
- **配置方式**: 手动编辑 Nginx 配置文件
- **文档**: [docs/deployment/access.md](docs/deployment/access.md)

#### 🎨 1Panel 面板部署（推荐已有 1Panel 用户）

- **适用**: 服务器已安装 [1Panel](https://1panel.cn/) 面板
- **配置方式**: 通过 Web 界面配置（无需编辑文件）
- **优势**: 一键 SSL、可视化管理、自动续期
- **文档**: [docs/deployment/ip-access.md](docs/deployment/ip-access.md)（包含 1Panel 快速配置）

### 快速开始

**选择标准 Nginx 部署**:

1. **阅读部署文档** → [docs/deployment/access.md](docs/deployment/access.md)
2. **问题排查** → [docs/deployment/troubleshooting.md](docs/deployment/troubleshooting.md)
3. **配置服务器环境** → 使用 [scripts/server-setup.sh](scripts/server-setup.sh)
4. **触发自动部署** → 推送版本标签

**选择 1Panel 部署**:

1. **阅读 1Panel 指南** → [docs/deployment/ip-access.md](docs/deployment/ip-access.md) ⭐
2. **问题排查** → [docs/deployment/troubleshooting.md](docs/deployment/troubleshooting.md)
3. **配置服务器环境** → 创建部署目录和环境变量
4. **通过 1Panel 配置** → Web 界面配置网站、反向代理、SSL
5. **触发自动部署** → 推送版本标签

### 自动部署流程

```bash
# 1. 开发完成后提交代码
git add .
git commit -m "feat: 新功能"
git push origin main

# 2. 创建版本标签触发自动部署
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions 自动执行部署
# 访问 https://github.com/你的用户名/snapmatch-platform/actions 查看进度
```

### 部署架构

- **前端**: Nginx / 1Panel 静态托管（Web + Admin）
- **后端**: Docker 容器化（NestJS）
- **CI/CD**: GitHub Actions 自动部署
- **触发条件**: 推送版本标签（如 `v1.0.0`）
- **部署目录**:
  - **标准 Nginx**: `/var/www/snapmatch`
  - **1Panel**: `/opt/1panel/apps/openresty/openresty/www/sites/{域名}/`

详细信息请查看 [部署文档](docs/README.md)。

## Web → Admin 跳转配置

`apps/web` 的「管理员登录」按钮默认在本地跳转到 `http://localhost:3001/login`，线上默认跳转到 `/admin/login`。如需自定义（例如线上使用独立域名），设置：

```bash
NEXT_PUBLIC_ADMIN_BASE_URL="https://admin.example.com"
```
