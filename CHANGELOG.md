# Changelog

## [v1.0.8] - 2025-12-29

### 🔧 架构调整

#### Admin 后台部署模式变更

- **从静态导出改为 Standalone 模式**:
  - `apps/admin/next.config.ts`: `output: 'export'` → `output: 'standalone'`
  - Admin 现在**需要 Node.js 运行时环境**（推荐 Node.js 20+）
  - 使用 PM2 进行进程管理
  - 原因：Admin 使用 BFF 架构（`/api/auth/*` 路由需要服务器运行时处理）

#### GitHub Actions Workflow 优化

- **拆分 Frontend 部署为两个独立 Job**:
  - `deploy-web`: 部署 Web 官网（静态文件）
  - `deploy-admin`: 部署 Admin 后台（Node.js 服务 + PM2）
  - 三个部署 Job 完全独立（Backend、Web、Admin）
  - 一个失败不影响其他部署

### 📝 文档更新

#### 新增/更新文档

- **[admin-architecture-and-deployment.md](./docs/admin-architecture-and-deployment.md)**:
  - 添加 Admin Node.js 运行时环境要求说明
  - 添加 PM2 部署完整流程
  - 添加 OpenResty 反向代理配置示例

- **[DEPLOYMENT_ACCESS.md](./docs/DEPLOYMENT_ACCESS.md)**:
  - 添加 Admin PM2 服务状态检查步骤
  - 添加端口 3001 验证流程

- **[DEPLOYMENT_TROUBLESHOOTING.md](./docs/DEPLOYMENT_TROUBLESHOOTING.md)**:
  - 添加 "问题 3: Admin 服务部署失败或无法访问" 完整排查流程
  - 更新 Workflow 架构依赖关系图（v1.0.8+）
  - 更新部署检查清单（新增 Admin PM2 检查项）

### ⚠️ 重要变更

- **服务器环境要求**:
  - 需要安装 Node.js 20+
  - 需要安装 PM2 进程管理器
  - 需要配置 OpenResty/Nginx 反向代理 `/admin` → `localhost:3001`

---

## [v1.0.7] - 2025-12-29

### 🚀 重大改进

#### Workflow 架构优化

- **拆分 Backend 和 Frontend 部署为独立 Job**:
  - Backend 失败不再阻止 Frontend 部署
  - 前后端可以独立部署和验证
  - 提高部署成功率和可靠性

#### 新增部署排查文档

- **[DEPLOYMENT_TROUBLESHOOTING.md](./docs/DEPLOYMENT_TROUBLESHOOTING.md)**:
  - Backend 部署失败完整排查流程
  - 前端文件未部署问题诊断
  - 网站访问问题调试技巧
  - Workflow 依赖关系详细说明
  - 手动部署脚本使用指南
  - 紧急恢复方案

### 📝 文档更新

- 更新 docs/README.md 添加排查文档索引
- 完善部署文档体系

---

## [v1.0.6] - 2025-12-29

### 🧹 维护

- 删除过时的部署文档
- 添加 @types/bcryptjs 类型定义
- 创建文档索引

---

## [v1.0.5] - 2025-12-29

### 🐛 Bug Fixes

#### Backend 容器退出问题修复

- **修复异步错误处理**:
  - 从 `void bootstrap()` 改为 `bootstrap().catch(...)`
  - 正确捕获并处理启动错误
  - 防止容器启动后立即退出

#### 前端部署完全重构

- **修复部署文件丢失问题**:
  - 新增前置目录准备步骤
  - 先设置目录所有权为部署用户
  - 先清理旧文件再上传新文件
  - 最后恢复 www-data 权限
- **改进部署流程**:
  1. 准备服务器目录（sudo 创建 + chown 给部署用户）
  2. 清理旧文件（保留 admin 目录）
  3. 上传 Web 和 Admin 文件
  4. 恢复 www-data:www-data 权限

---

## [v1.0.4] - 2025-12-29

### 🐛 Bug Fixes

#### Backend 部署修复

- **修复 Docker 权限错误**: 所有 Docker 命令添加 `sudo` 权限
  - `docker load` - 加载镜像
  - `docker stop/rm` - 停止和删除容器
  - `docker run` - 启动容器
  - `docker logs` - 查看日志
- **增强健康检查**: 失败时输出容器日志以便调试

#### 前端部署修复

- **修复部署文件丢失问题**:
  - 从危险的 `rm: true` 改为安全的 `overwrite: true`
  - 先上传文件，后清理旧文件（而非先删除）
  - 避免上传失败导致文件永久丢失
- **新增文件权限设置步骤**:
  - 自动设置 `www-data:www-data` 所有权
  - 自动设置 `755` 权限
- **优化清理策略**:
  - Web 部署时保留 admin 目录
  - 使用 `sudo` 确保清理权限

### 📝 Documentation

- 新增手动部署脚本 `scripts/manual-deploy.sh`
- 新增部署故障恢复方案

---

## [v1.0.3] - 2025-12-29

### ⚠️ Issues

- Backend Docker 权限错误（已在 v1.0.4 修复）
- 部署文件丢失问题（已在 v1.0.4 修复）

---

## [v1.0.2] - 2025-12-28

### 🔧 Fixes

- 修复 Backend 健康检查测试失败
- 添加 Husky + Lint-staged 代码质量自动化
- 修复 Husky pre-commit hook 兼容性

---

## [v1.0.1] - 2025-12-28

### 🔧 Fixes

- 修复 TypeScript 类型检查命令错误
- 统一添加 `type-check` 脚本到所有项目

---

## [v1.0.0] - 2025-12-28

### ✨ Features

- 升级 ESLint 到 v9.39.2
- 迁移到 ESLint 扁平配置格式
- 修复 React Hooks 纯度违规
- 完善 GitHub Actions CI/CD 流程
