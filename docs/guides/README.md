# 开发指南

本目录包含 SnapMatch Platform 的各类开发指南和迁移文档，提供具体的操作步骤和最佳实践。

## 📋 指南列表

### API 版本化

- **[API 版本化迁移指南](./api-versioning/migration-guide.md)** ⭐
  - 为什么需要 API 版本化
  - 影响分析（10 个代码位置需要修改）
  - 完整迁移方案
  - 测试策略与风险评估
  - 回滚方案

- **[API 版本化 Checklist](./api-versioning/checklist.md)**
  - 迁移前准备清单
  - 代码修改清单（逐文件逐行）
  - 本地测试验证步骤
  - 生产部署验证
  - 问题排查指南
  - 签字确认表格

---

## 🎯 使用建议

### 执行 API 版本化迁移

1. **第一步**：阅读 [迁移指南](./api-versioning/migration-guide.md)，理解整体方案和影响
2. **第二步**：打印或复制 [Checklist](./api-versioning/checklist.md)，逐项执行
3. **第三步**：严格按照 Checklist 的 4 个测试阶段进行验证
4. **第四步**：部署前再次确认所有测试通过

### 理解 API 版本化的背景

- 先阅读 [请求链路分析](../architecture/request-flow.md)，理解当前的请求流程
- 再阅读 [双后端架构](../architecture/dual-backend.md)，理解为什么需要修改 Admin 的路径转换逻辑

---

## 📌 注意事项

⚠️ **重要提醒**：

- API 版本化迁移是**破坏性变更**，会影响所有调用 Backend API 的地方
- 建议在**非生产环境**先完整测试所有功能
- 部署时需要**同时更新** Backend 和 Admin 代码
- 部署后 CDN 可能有缓存，需等待几分钟或添加 queryString 强制刷新

---

## 🔗 相关文档

- **架构文档**: [架构文档索引](../architecture/README.md)
- **请求链路**: [请求链路分析](../architecture/request-flow.md)
- **Backend 开发**: [Backend README](../backend/README.md)
- **Admin 开发**: [Admin README](../admin/README.md)
- **部署文档**: [部署总览](../deployment/overview.md)

---

**最后更新**: 2025-12-31
