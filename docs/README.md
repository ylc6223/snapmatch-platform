# SnapMatch Platform 文档

## 📚 文档索引

### 部署文档

- **[DEPLOYMENT_ACCESS.md](./DEPLOYMENT_ACCESS.md)** - 线上部署和访问配置指南（域名访问）
  - OpenResty/Nginx 反向代理配置
  - 健康检查和验证步骤
  - 常见问题排查

- **[DEPLOYMENT_IP_ACCESS.md](./DEPLOYMENT_IP_ACCESS.md)** - 使用 IP 地址访问配置指南（无需域名备案）
  - IP 访问配置方案
  - 1Panel 快速配置
  - 从 IP 切换到域名的步骤

### 架构设计文档

#### Admin 后台

- **[admin-architecture-and-deployment.md](./admin-architecture-and-deployment.md)** - Admin 系统架构和部署方案
- **[admin-auth-rbac-design.md](./admin-auth-rbac-design.md)** - Admin RBAC 权限设计
- **[admin-auth-session-kickout.md](./admin-auth-session-kickout.md)** - 会话踢出机制设计
- **[admin-session-expired-ui-spec.md](./admin-session-expired-ui-spec.md)** - 会话过期 UI 规范
- **[admin-tanstack-query-global-error-handling.md](./admin-tanstack-query-global-error-handling.md)** - TanStack Query 全局错误处理
- **[admin-api-strategy.md](./admin-api-strategy.md)** - API 调用策略

#### Backend 后端

- **[backend.md](./backend.md)** - Backend 服务架构说明

### 其他文档

- **[deployment.md](./deployment.md)** - 通用部署说明
- **[name.md](./name.md)** - 项目命名规范

---

## 🚀 快速开始

### 本地开发

参考项目根目录的 [README.md](../README.md)

### 部署到生产环境

1. **域名已备案**: 参考 [DEPLOYMENT_ACCESS.md](./DEPLOYMENT_ACCESS.md)
2. **域名未备案（使用 IP）**: 参考 [DEPLOYMENT_IP_ACCESS.md](./DEPLOYMENT_IP_ACCESS.md)

---

## 📝 文档维护

- 文档应保持简洁、准确、最新
- 过时的文档应及时删除或标记为已废弃
- 新增文档时应更新此索引
