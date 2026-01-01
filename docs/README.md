# SnapMatch Platform 文档

本目录仅放“可长期维护/可复用”的正式文档；讨论稿与评审材料请放到 `discuss/`。

## 📚 文档索引（按主题）

### 架构（architecture）⭐

- **[架构文档索引](./architecture/README.md)**：系统架构、双后端模式、请求链路分析
  - [项目结构总览](./architecture/overview.md) - Monorepo 整体结构与技术栈
  - [双后端架构](./architecture/dual-backend.md) - BFF 模式详解
  - [请求链路分析](./architecture/request-flow.md) - 完整请求流程追踪

### 开发指南（guides）

- **[开发指南索引](./guides/README.md)**：迁移方案、最佳实践
  - [API 版本化迁移指南](./guides/api-versioning/migration-guide.md) - 完整迁移方案与影响分析
  - [API 版本化 Checklist](./guides/api-versioning/checklist.md) - 逐步操作清单
  - [Worktree 并行开发](./guides/worktree-dev.md) - 自动分配端口，一键启动（避免多 worktree 冲突）

### 部署（deployment）

- **[部署总览](./deployment/overview.md)**：部署形态与阅读顺序
- **[域名访问部署](./deployment/access.md)**：Nginx/OpenResty 反向代理（推荐）
- **[IP 访问部署（含 1Panel）](./deployment/ip-access.md)**：无需域名备案的方案与迁移路径
- **[部署排查指南](./deployment/troubleshooting.md)**：常见问题定位与修复 ⭐

### Admin（admin）

- **[Admin 文档索引](./admin/README.md)**：Admin 架构 / 鉴权 / 交互规范入口

### Backend（backend）

- **[Backend 开发说明](./backend/README.md)**：NestJS、JWT + RBAC、数据模型与本地运行

### 规范（conventions）

- **[命名规范](./conventions/naming.md)**：项目命名与约定

---

## 🚀 快速开始

### 本地开发

参考项目根目录的 [README.md](../README.md)。

### 部署到生产环境

1. **域名已备案**：从 [域名访问部署](./deployment/access.md) 开始
2. **域名未备案（使用 IP）**：从 [IP 访问部署](./deployment/ip-access.md) 开始
