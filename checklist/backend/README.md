# 后端服务 - 任务清单

> **说明**: 本文档用于跟踪后端服务（NestJS）的开发进度

**应用位置**: `apps/backend/`
**最后更新**: 2026-01-03
**状态**: 🟢 开发中

---

## 📊 总体进度

**已完成**: 约 20%（基础框架与认证）
**核心阻塞**: 业务数据模型未定义

---

## ✅ 已实现功能

### 1. 基础框架

- [x] NestJS 项目初始化
- [x] 模块化结构
- [x] 全局异常处理
- [x] 响应封装（ApiResponse）
- [x] Swagger API 文档配置
- [x] 环境变量配置

### 2. 认证与鉴权

- [x] JWT 认证模块
- [x] 账号密码登录
- [x] Access/Refresh Token 机制
- [x] RBAC 基础框架
  - [x] User 实体
  - [x] Role 实体
  - [x] Permission 实体
  - [x] UserRole 关联
  - [x] RolePermission 关联
- [x] `@Roles()` Guard
- [x] `@Permissions()` Guard（基础）
- [x] 登录/登出接口

### 3. 用户管理

- [x] 用户 CRUD 接口
- [x] 用户列表与分页
- [x] 用户创建与更新

### 4. 资产上传

- [x] 统一签名接口 `POST /api/assets/sign`
- [x] S3 分片上传支持
- [x] 分片管理接口
  - [x] 列出已上传分片
  - [x] 获取分片上传签名
  - [x] 完成分片上传
- [x] 上传确认接口（部分完成）
  - [x] 作品集素材确认
  - [ ] 交付照片确认（业务数据入库未完成）

### 5. 存储

- [x] 存储服务抽象（StorageService）
- [x] S3 兼容存储实现
- [x] 配置管理

### 6. 数据库

- [x] MySQL 连接配置
- [x] TypeORM 集成
- [x] 基础实体定义（RBAC 相关）

---

## ❌ 未实现功能

### 1. 数据模型（最高优先级）🔴

- [ ] Project 实体 - 项目模型
- [ ] Album 实体 - 相册/分组
- [ ] Photo 实体 - 照片模型
- [ ] Selection 实体 - 选片记录
- [ ] ViewerLink 实体 - 选片链接
- [ ] Work 实体 - 作品集
- [ ] Category 实体 - 作品分类
- [ ] Banner 实体 - 轮播图
- [ ] Customer 实体 - 客户档案
- [ ] Order 实体 - 订单模型
- [ ] WatermarkConfig 实体 - 水印配置
- [ ] AuditLog 实体 - 操作日志

**实现任务**:

- [ ] 创建所有实体定义
- [ ] 创建 DTO 定义
- [ ] 创建 Repository 层
- [ ] 编写数据库迁移脚本
- [ ] 初始化种子数据

---

### 2. 业务模块

#### 2.1 作品集管理 📸

- [ ] `GET /api/works` - 作品列表
- [ ] `POST /api/works` - 创建作品
- [ ] `GET /api/works/:id` - 作品详情
- [ ] `PATCH /api/works/:id` - 更新作品
- [ ] `DELETE /api/works/:id` - 删除作品
- [ ] `GET /api/categories` - 分类列表
- [ ] `POST /api/categories` - 创建分类
- [ ] `PATCH /api/categories/:id` - 更新分类
- [ ] `DELETE /api/categories/:id` - 删除分类
- [ ] `GET /api/banners` - 轮播图列表
- [ ] `POST /api/banners` - 创建轮播图
- [ ] `PATCH /api/banners/:id` - 更新轮播图
- [ ] `DELETE /api/banners/:id` - 删除轮播图

#### 2.2 项目管理 🎯

- [ ] `GET /api/projects` - 项目列表（支持角色过滤）
- [ ] `POST /api/projects` - 创建项目
- [ ] `GET /api/projects/:id` - 项目详情
- [ ] `PATCH /api/projects/:id` - 更新项目
- [ ] `DELETE /api/projects/:id` - 删除项目
- [ ] `GET /api/projects/:id/photos` - 照片列表
- [ ] `PATCH /api/photos/:id` - 更新照片
- [ ] `DELETE /api/photos/:id` - 删除照片
- [ ] `POST /api/photos/batch-move` - 批量移动照片

#### 2.3 照片处理 🖼️

- [ ] `POST /api/photos/confirm` - 照片上传确认（业务数据入库）
- [ ] 异步处理服务
  - [ ] 生成缩略图
  - [ ] 生成预览图（带水印）
  - [ ] 原图加密存储
  - [ ] EXIF 信息提取
- [ ] 处理状态回写
- [ ] 处理失败重试机制

#### 2.4 选片管理 💻

- [ ] `POST /api/projects/:id/viewer-link` - 生成选片链接
- [ ] `GET /api/viewer/:token` - 获取选片信息
- [ ] `GET /api/viewer/:token/photos` - 获取照片列表
- [ ] `PUT /api/viewer/:token/selection` - 保存选片草稿
- [ ] `POST /api/viewer/:token/submit` - 提交选片
- [ ] `GET /api/projects/:id/selection` - 选片详情
- [ ] `GET /api/projects/:id/selection/stats` - 选片统计

#### 2.5 订单管理 💰

- [ ] `GET /api/orders` - 订单列表
- [ ] `GET /api/orders/:id` - 订单详情
- [ ] `PATCH /api/orders/:id` - 更新订单
- [ ] `POST /api/orders/offline` - 线下订单录入
- [ ] `POST /api/projects/:id/extras/order` - 生成加片订单
- [ ] 订单状态流转
- [ ] 小程序支付订单同步

#### 2.6 通知系统 🔔

- [ ] 通知服务模块
- [ ] 通知模板管理
- [ ] 通知触发逻辑
- [ ] 通知通道实现（至少选择一种）
  - [ ] 小程序订阅消息
  - [ ] 短信通知
  - [ ] 邮件通知
  - [ ] 站内消息

#### 2.7 精修交付 ✨

- [ ] `POST /api/projects/:id/retouched` - 上传精修图
- [ ] `POST /api/projects/:id/retouched/confirm` - 客户确认
- [ ] 精修图处理与预览生成

#### 2.8 系统设置 ⚙️

- [ ] `GET /api/settings/watermark` - 获取水印配置
- [ ] `PATCH /api/settings/watermark` - 更新水印配置
- [ ] `GET /api/settings/storage` - 获取存储配置
- [ ] `PATCH /api/settings/storage` - 更新存储配置
- [ ] `GET /api/settings/miniprogram` - 获取小程序配置
- [ ] `PATCH /api/settings/miniprogram` - 更新小程序配置
- [ ] `GET /api/roles` - 角色列表
- [ ] `POST /api/roles` - 创建角色
- [ ] `PATCH /api/roles/:id` - 更新角色
- [ ] `DELETE /api/roles/:id` - 删除角色

---

### 3. 权限细化 🔐

- [ ] 数据隔离逻辑
  - [ ] `photographer` 仅查看被指派的项目
  - [ ] `sales` 仅查看负责客户的订单/项目
  - [ ] Repository 层自动过滤
- [ ] 细粒度权限点实现
- [ ] `@Permissions()` Guard 完善
- [ ] 数据范围 Scope

---

### 4. 统计与分析 📊

- [ ] `GET /api/analytics/overview` - 概览统计
- [ ] `GET /api/analytics/projects` - 项目统计
- [ ] `GET /api/analytics/revenue` - 收入统计
- [ ] `GET /api/analytics/performers` - 绩效统计
- [ ] `GET /api/viewer-links/:id/stats` - 链接访问统计
- [ ] 统计数据缓存
- [ ] 定时任务更新缓存

---

### 5. 客户管理 👥

- [ ] `GET /api/customers` - 客户列表
- [ ] `GET /api/customers/:id` - 客户详情
- [ ] `POST /api/customers` - 创建客户
- [ ] `PATCH /api/customers/:id` - 更新客户
- [ ] `GET /api/customers/:id/projects` - 客户项目列表
- [ ] `GET /api/customers/:id/orders` - 客户订单列表

---

### 6. 用户管理增强 👤

- [ ] `POST /api/users` - 创建用户
- [ ] `PATCH /api/users/:id` - 更新用户
- [ ] `POST /api/users/:id/reset-password` - 重置密码
- [ ] `DELETE /api/users/:id` - 删除用户

---

## 🔧 技术债务

### 1. 数据库

- [ ] 创建数据库迁移脚本
- [ ] 编写回滚脚本
- [ ] 生产环境迁移方案
- [ ] 索引优化
- [ ] 查询优化（解决 N+1 问题）

### 2. 文档

- [ ] 完善 Swagger API 文档
  - [ ] 所有业务 API 的请求/响应定义
  - [ ] 错误码文档
  - [ ] 示例代码
- [ ] Postman Collection 导出
- [ ] 架构设计文档

### 3. 测试

- [ ] 单元测试（Service 层）
- [ ] 集成测试（API 层）
- [ ] E2E 测试（关键流程）
- [ ] 测试覆盖率报告

### 4. 性能优化

- [ ] 异步处理队列（Bull/BullMQ）
- [ ] Worker 并发控制
- [ ] 查询结果缓存
- [ ] 接口响应时间优化
- [ ] 数据库连接池优化

### 5. 安全加固

- [ ] 参数验证 DTO 完善
- [ ] SQL 注入防护审查
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] API 访问频率限制（Rate Limiting）
- [ ] 敏感数据加密
- [ ] 安全审计日志

### 6. 运维支持

- [ ] 健康检查接口完善
- [ ] Prometheus 指标暴露
- [ ] 日志聚合（ELK/Loki）
- [ ] 错误追踪（Sentry）
- [ ] 性能监控（APM）
- [ ] Docker 镜像优化
- [ ] 部署脚本完善

---

## 📝 开发计划

### Phase 1: 数据模型与核心业务（2-3 周）

**Week 1**:

- [ ] 定义所有核心实体
- [ ] 创建数据库迁移
- [ ] 编写 Repository 层

**Week 2-3**:

- [ ] 项目管理模块
- [ ] 照片处理服务
- [ ] 选片管理模块

### Phase 2: 业务完善（2-3 周）

**Week 4-5**:

- [ ] 作品集管理模块
- [ ] 订单管理模块
- [ ] 通知系统

**Week 6**:

- [ ] 精修交付流程
- [ ] 权限细化

### Phase 3: 增强功能（1-2 周）

**Week 7-8**:

- [ ] 统计与分析
- [ ] 客户管理
- [ ] 系统设置
- [ ] 性能优化

---

## 🔗 相关资源

- **NestJS 文档**: https://docs.nestjs.com/
- **TypeORM 文档**: https://typeorm.io/
- **API 文档**: http://localhost:3002/api/docs（开发环境）
- **Admin Checklist**: [checklist/admin/](../admin/)
- **Web Checklist**: [checklist/web/](../web/)

---

**维护者**: 开发团队
**最后更新**: 2026-01-03
