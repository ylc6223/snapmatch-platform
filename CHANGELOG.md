# Changelog

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
