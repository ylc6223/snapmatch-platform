# SnapMatch Platform 项目进度总览

> **文档版本**: v1.0  
> **创建日期**: 2026-01-09  
> **最后更新**: 2026-01-09  
> **维护者**: 开发团队

---

## 📊 目录

- [已完成功能](#已完成功能)
- [待开发功能](#待开发功能)
- [推荐开发顺序](#推荐开发顺序)
- [下一步建议](#下一步建议)

---

## ✅ 已完成功能

### 🔐 认证与权限系统

**状态**: ✅ 已完成

**Backend**:

- JWT + RBAC 权限控制
- 管理员登录/登出
- 会话管理（踢出机制、Token 刷新）
- MySQL 数据库（TypeORM）：
  - `admin_users` - 管理员用户表
  - `auth_sessions` - 会话表

**Admin**:

- 登录页面 (`/login`)
- 受保护路由
- 会话过期处理
- 权限装饰器

**相关文档**:

- `docs/admin/auth-rbac-design.md`
- `docs/admin/session-expired-ui-spec.md`

---

### 🚀 基础设施

**状态**: ✅ 已完成

**技术栈**:

- Admin: Next.js 15 + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- 前端请求层: React Query (TanStack Query)
- API 文档: Swagger

**部署架构**:

- GitHub Actions CI/CD
- Docker 容器化（Backend）
- PM2 进程管理（Admin）
- Nginx/OpenResty 反向代理

**相关文档**:

- `docs/deployment/access.md`
- `docs/deployment/ip-access.md`
- `docs/deployment/troubleshooting.md`

---

### ☁️ 云存储（Cloudflare R2）

**状态**: ✅ 已完成

**后端实现**:

- S3 兼容存储抽象层
  - `IStorageProvider` - 基础能力接口
  - `IMultipartUploadProvider` - 分片上传接口
- R2 Provider 实现：
  - 预签名 PUT URL
  - Multipart Upload（create/sign/list/complete/abort）
- Storage Service - 统一入口

**Assets 模块接口**:

```typescript
POST   /api/assets/sign                // 获取上传凭证
POST   /api/assets/multipart/sign-part // 签名分片上传 URL
POST   /api/assets/multipart/list-parts // 列出已上传分片
POST   /api/assets/multipart/complete  // 合并分片
POST   /api/assets/multipart/abort     // 取消上传
POST   /api/photos/confirm             // 照片确认入库
POST   /api/works/:workId/assets/confirm // 作品集素材确认
```

**前端组件**:

- 照片上传组件（支持断点续传）
- 作品集素材上传组件
- 上传进度显示

**相关文档**:

- `docs/admin/upload-backend-implementation-summary.md`
- `docs/admin/upload-implementation-guide.md`
- `docs/admin/r2-setup-summary.md`

---

### 🎨 Admin 页面框架

**状态**: ✅ 已完成

**已实现页面**:

| 页面       | 路由                              | 状态        | 说明                                           |
| ---------- | --------------------------------- | ----------- | ---------------------------------------------- |
| 数据概览   | `/dashboard/analytics`            | ✅ 已完成   | 6 个数据卡片（项目统计、选片监控、照片数据等） |
| 快捷入口   | `/dashboard/shortcuts`            | ✅ 已完成   | 项目快速访问                                   |
| 系统设置   | `/dashboard/settings/*`           | ✅ 已完成   | 账户、存储、小程序配置                         |
| 客户管理   | `/dashboard/crm/customers`        | ⏳ 框架完成 | 需完善 CRUD 功能                               |
| 订单管理   | `/dashboard/crm/orders`           | ⏳ 框架完成 | 待开发                                         |
| 交付管理   | `/dashboard/delivery/*`           | ⏳ 部分完成 | 照片上传已完成，列表/删除待完善                |
| 开发工具   | `/dashboard/dev/*`                | ✅ 已完成   | Client Viewer、上传测试                        |
| 作品集管理 | `/dashboard/(lumina)/portfolio/*` | ✅ 已完成   | 作品、分类、轮播图                             |

---

### 📦 数据模型设计

**状态**: ✅ 已完成

**已设计实体**:

- `CustomerEntity` - 客户档案
- `PackageEntity` - 套餐配置
- `ProjectEntity` - 项目
- `PhotoEntity` - 照片
- `SelectionEntity` - 选片记录

**数据库表结构**: ✅ 已完成

- TypeORM Entity 定义
- MySQL 建表脚本：`docs/admin/sql-scripts-ready-to-run.md`

**相关文档**:

- `docs/admin/data-model-design.md`

---

## ❌ 待开发功能

### 📋 优先级 P0（必须有）

#### 1️⃣ 套餐管理

**预计工作量**: 2-3 天

**后端接口**:

```typescript
GET    /api/packages          // 套餐列表（分页、筛选）
POST   /api/packages          // 创建套餐
GET    /api/packages/:id      // 套餐详情
PATCH  /api/packages/:id      // 更新套餐
DELETE /api/packages/:id      // 删除套餐
```

**Entity 字段**:

- `name` - 套餐名称
- `description` - 套餐描述
- `includedRetouchCount` - 包含精修张数
- `includedAlbumCount` - 包含入册张数
- `includeAllOriginals` - 是否底片全送
- `price` - 套餐价格（分）
- `extraRetouchPrice` - 超额精修单价（分/张）
- `extraAlbumPrice` - 超额入册单价（分/张）
- `isActive` - 是否启用
- `sort` - 排序

**Admin 页面**:

- 套餐列表页（表格展示、启用/禁用、排序）
- 套餐创建/编辑表单

**依赖**:

- ✅ 数据模型已完成
- ✅ 基础设施已完成
- ⏳ 需开发 Backend CRUD
- ⏳ 需开发 Admin 页面

---

#### 2️⃣ 客户管理增强

**预计工作量**: 1-2 天

**后端接口**:

```typescript
GET    /api/customers         // 客户列表（分页、搜索）
POST   /api/customers         // 创建客户
GET    /api/customers/:id     // 客户详情
PATCH  /api/customers/:id     // 更新客户
DELETE /api/customers/:id     // 删除客户
```

**Entity 字段**:

- `name` - 姓名
- `phone` - 手机号（唯一）
- `wechatOpenId` - 微信 OpenID（可选）
- `email` - 邮箱（可选）
- `notes` - 备注说明
- `tags` - 标签数组（JSON）

**Admin 页面**:

- 客户列表页（DataTable，支持搜索、分页）
- 客户详情/编辑表单
- 关联项目展示

**依赖**:

- ✅ 数据模型已完成
- ✅ 页面框架已存在
- ⏳ 需开发 Backend CRUD
- ⏳ 需完善 Admin 页面

---

#### 3️⃣ 项目管理完整流程

**预计工作量**: 2-3 天

**后端接口**:

```typescript
GET    /api/projects              // 项目列表（分页、筛选）
POST   /api/projects              // 创建项目
GET    /api/projects/:id          // 项目详情
PATCH  /api/projects/:id          // 更新项目
DELETE /api/projects/:id          // 删除项目
POST   /api/projects/:id/status   // 状态流转
```

**Entity 字段**:

- `name` - 项目名称
- `description` - 项目描述
- `customerId` - 客户 ID（外键）
- `packageId` - 套餐 ID（外键）
- `shootDate` - 拍摄日期
- `token` - Viewer 访问 Token（唯一）
- `expiresAt` - Token 过期时间
- `status` - 项目状态（7 个状态）
- `allowDownloadOriginal` - 是否允许下载原图
- `watermarkEnabled` - 是否开启水印
- `selectionDeadline` - 选片截止日期

**状态机**:

```
PENDING（待选片）
  ↓
SELECTING（选片中）
  ↓
SUBMITTED（已提交）
  ↓
RETOUCHING（修图中）
  ↓
PENDING_CONFIRMATION（待确认）
  ↓
DELIVERED（已交付）
```

**Admin 页面**:

- 项目列表页（DataTable，支持状态筛选）
- 项目创建表单（选择客户、套餐）
- 项目详情页（照片、选片进度、状态流转）

**依赖**:

- ✅ 数据模型已完成
- ✅ 客户管理（前置）
- ✅ 套餐管理（前置）
- ⏳ 需更新 Backend Project Entity
- ⏳ 需开发 Admin 项目创建/列表页

---

#### 4️⃣ 照片管理完整流程

**预计工作量**: 2-3 天

**后端接口**:

```typescript
GET    /api/projects/:id/photos  // 照片列表（分页）
GET    /api/photos/:id           // 照片详情
DELETE /api/photos/:id           // 删除照片
POST   /api/photos/batch-delete  // 批量删除
POST   /api/photos/confirm       // 上传确认 ✅ 已实现
```

**Entity 字段**:

- `projectId` - 项目 ID（外键）
- `filename` - 原始文件名
- `originalKey` - 原图存储 Key
- `previewKey` - 预览图存储 Key（带水印）
- `thumbKey` - 缩略图存储 Key
- `retouchedKey` - 精修图存储 Key（可选）
- `retouchedPreviewKey` - 精修预览图 Key（可选）
- `fileSize` - 文件大小
- `width` - 图片宽度
- `height` - 图片高度
- `status` - 处理状态

**Admin 页面**:

- 照片列表页（网格视图，支持预览）
- 照片批量操作（删除、下载）
- 照片详情弹窗（EXIF 信息）

**依赖**:

- ✅ 上传功能已完成
- ✅ 数据模型已完成
- ⏳ 需开发 Photo CRUD 接口
- ⏳ 需开发 Admin 照片列表/删除页

---

#### 5️⃣ 选片功能（Viewer）

**预计工作量**: 4-5 天

**后端接口**:

```typescript
GET    /api/viewer/:token           // 获取选片信息（项目、套餐、照片）
GET    /api/viewer/:token/photos    // 照片列表（分页）
PUT    /api/viewer/:token/selection // 保存选片草稿（幂等）
POST   /api/viewer/:token/submit    // 提交选片（锁定）
```

**Selection Entity 字段**:

- `projectId` - 项目 ID（外键）
- `customerId` - 客户 ID（外键）
- `status` - 选片状态（DRAFT/SUBMITTED/LOCKED）
- `items` - 选片项数组（JSON）
  ```typescript
  [
    {
      photoId: 'pho_xxx',
      flags: ['liked', 'in_album', 'retouch'],
      markedAt: 1704350000000,
    },
  ];
  ```
- `likedCount` - 喜欢数量（统计冗余）
- `inAlbumCount` - 入册数量（统计冗余）
- `retouchCount` - 精修数量（统计冗余）
- `submittedAt` - 提交时间

**Viewer 前端**（独立页面，非 Admin）:

- `/client/selection/[token]` - 客户选片页
- 照片浏览（瀑布流/大图模式）
- 选片标记（喜欢/入册/精修）
- 套餐约束实时显示（已选 X / 包含 Y）
- 超额提示（加片费用计算）
- 提交确认

**Admin 页面**:

- 选片进度监控页
- 展示选片结果（标记分布）
- 状态流转（提交 → 修图中 → 待确认 → 已交付）

**依赖**:

- ✅ 照片管理（前置）
- ✅ 项目管理（前置）
- ⏳ 需开发 Selection Entity + Controller
- ⏳ 需开发 Viewer 前端
- ⏳ 需开发 Admin 监控页

---

### 📋 优先级 P1（应该有）

#### 6️⃣ 精修交付流程

**预计工作量**: 3-4 天

**后端接口**:

```typescript
POST   /api/projects/:id/retouched             // 上传精修图（批量）
POST   /api/projects/:id/retouched/confirm     // 客户确认
GET    /api/viewer/:token/retouched            // 查看精修图
```

**业务逻辑**:

1. 管理员根据选片结果上传精修图
2. 前端生成精修预览图（加水印）
3. 通知客户查看并确认
4. 客户确认后完成交付

**Admin 页面**:

- 精修上传页（展示选片结果，拖拽上传）
- 精修预览页（对比原片）

**Viewer 前端**:

- 精修图浏览
- 确认按钮

**依赖**:

- ✅ 选片功能（前置）
- ⏳ 需开发精修上传逻辑
- ⏳ 需开发确认流程

---

#### 7️⃣ 订单管理

**预计工作量**: 2-3 天

**后端接口**:

```typescript
GET    /api/orders             // 订单列表
POST   /api/orders             // 创建订单
GET    /api/orders/:id         // 订单详情
PATCH  /api/orders/:id         // 更新订单状态
```

**Order Entity 字段**:

- `projectId` - 项目 ID（外键）
- `customerId` - 客户 ID（外键）
- `type` - 订单类型（套餐/加片/相册）
- `amount` - 订单金额（分）
- `status` - 订单状态（待支付/已支付/已取消）
- `items` - 订单项数组（JSON）

**业务逻辑**:

- 加片订单生成（超额计算）
- 套餐订单同步（小程序支付）
- 线下订单录入

**Admin 页面**:

- 订单列表（DataTable）
- 订单详情
- 财务统计

**依赖**:

- ✅ 项目管理（前置）
- ✅ 客户管理（前置）
- ⏳ 需开发 Order Entity + Controller
- ⏳ 需开发 Admin 订单页面

---

### 📋 优先级 P2（可以有）

#### 8️⃣ 数据统计与报表

**预计工作量**: 2-3 天

**功能**:

- 本月拍摄量统计
- 选片率分析
- 修图师绩效统计
- 收入报表

**Admin 页面**:

- 数据大屏（Dashboard 增强）
- 图表可视化（Chart.js / Recharts）

---

#### 9️⃣ 通知系统

**预计工作量**: 2-3 天

**功能**:

- 客户提交选片 → 通知管理员
- 精修完成 → 通知客户
- 客户确认 → 完成交付

**实现**:

- 小程序订阅消息
- 邮件通知（可选）
- Admin 内通知中心

---

## 🎯 推荐开发顺序

### 阶段 1: 基础数据管理（1-2 周）

**目标**: 能够创建完整的项目（关联客户、套餐）

1. ✅ **套餐管理**（2-3 天）
   - Backend Entity + Controller + Service
   - Admin 套餐列表/表单页面
   - 与项目创建流程集成

2. ✅ **客户管理增强**（1-2 天）
   - Backend Entity + Controller + Service
   - Admin 客户列表/详情/表单
   - 搜索、分页、筛选

3. ✅ **项目管理完善**（2-3 天）
   - 更新 Project Entity（关联客户、套餐）
   - 实现状态流转逻辑
   - Admin 项目创建/列表/详情页

**里程碑**: 可以创建完整的项目，包含客户和套餐信息

---

### 阶段 2: 照片管理闭环（1 周）

**目标**: 完整的照片上传 → 管理 → 删除流程

4. ✅ **照片列表/删除**（2-3 天）
   - Photo Entity + CRUD 接口
   - Admin 照片列表页（网格视图）
   - 照片批量操作（删除、下载）

5. ✅ **照片预览与详情**（1-2 天）
   - 照片详情弹窗
   - EXIF 信息展示
   - 存储信息展示

**里程碑**: 完整的照片管理功能

---

### 阶段 3: 选片核心功能（1-2 周）

**目标**: 客户可以通过链接选片，管理员可监控进度

6. ✅ **选片后端**（2-3 天）
   - Selection Entity + Controller
   - 套餐约束检查
   - 选片统计与幂等处理

7. ✅ **Viewer 前端**（3-4 天）
   - 客户选片页面（独立路由）
   - 照片浏览（瀑布流/大图）
   - 选片标记（喜欢/入册/精修）
   - 提交确认

8. ✅ **Admin 选片监控**（1-2 天）
   - 选片进度列表
   - 选片结果展示
   - 状态流转

**里程碑**: 完整的选片流程

---

### 阶段 4: 精修交付（1 周）

**目标**: 完整的精修交付闭环

9. ✅ **精修图上传**（2-3 天）
   - 批量上传逻辑
   - 与选片结果对齐
   - 前端生成预览图

10. ✅ **客户确认流程**（1-2 天）
    - Viewer 精修预览页
    - 确认接口
    - 状态更新

**里程碑**: 精修交付完整流程

---

### 阶段 5: 订单与财务（可选，1 周）

**目标**: 完整的订单和财务管理

11. ✅ **订单管理**（2-3 天）
    - Order Entity + Controller
    - 加片订单生成
    - 订单列表/详情

12. ✅ **财务统计**（1-2 天）
    - 收入报表
    - 数据大屏增强

**里程碑**: 订单与财务管理

---

## 🚀 下一步建议

### 推荐起点：套餐管理

**理由**:

1. ✅ 数据模型已完成，直接开发即可
2. ✅ 是项目管理的前置依赖
3. ✅ 相对独立，适合快速启动
4. ✅ 预计 2-3 天完成，成就感强

**开发任务**:

1. Backend 开发：
   - 创建 `PackageEntity`
   - 实现 `PackagesController` + `PackagesService`
   - 添加 CRUD 接口

2. Admin 开发：
   - 创建套餐列表页（`/dashboard/settings/packages`）
   - 创建套餐表单组件（新增/编辑）
   - 使用 DataTable 展示数据
   - 集成 React Query 管理状态

3. 测试：
   - Swagger 接口测试
   - 前后端联调
   - 创建测试数据

---

### 技术准备

**Backend 开发环境**:

```bash
# 确保后端正在运行
pnpm -C apps/backend dev

# 访问 Swagger
http://localhost:3002/api/v1/docs
```

**Admin 开发环境**:

```bash
# 确保 Admin 正在运行
pnpm -C apps/admin dev

# 访问 Admin
http://localhost:3001
```

**数据库**:

- MySQL + TypeORM
- 已有建表脚本：`docs/admin/sql-scripts-ready-to-run.md`
- Entity 定义：`CustomerEntity`、`PackageEntity`、`ProjectEntity`、`PhotoEntity`、`SelectionEntity`

---

### 开发规范

**Backend**:

- 遵循 NestJS 最佳实践
- 使用 Swagger 注解
- 实现输入验证（class-validator）
- 统一错误处理

**Admin**:

- 使用 React Query 管理数据
- 遵循现有组件库（shadcn/ui）
- 保持设计一致性
- 使用 TypeScript 严格模式

**Git 提交**:

```bash
# feat: 新功能
# fix: Bug 修复
# refactor: 重构
# docs: 文档更新

git commit -m "feat(backend): 实现套餐管理 CRUD 接口"
```

---

## 📚 相关文档

**架构设计**:

- `docs/admin/README.md` - Admin 文档索引
- `docs/backend/README.md` - Backend 开发说明
- `docs/admin/data-model-design.md` - 数据模型设计
- `docs/admin/prd.md` - 产品需求文档

**API 文档**:

- Swagger: `http://localhost:3002/api/v1/docs`
- `docs/backend/swagger.md` - Swagger 规范

**上传功能**:

- `docs/admin/upload-backend-implementation-summary.md` - R2 上传实现
- `docs/admin/upload-implementation-guide.md` - 前端上传指南

**部署**:

- `docs/deployment/access.md` - 标准部署指南
- `docs/deployment/ip-access.md` - 1Panel 部署指南

---

## 📝 维护日志

| 日期       | 版本 | 更新内容                                 | 维护者 |
| ---------- | ---- | ---------------------------------------- | ------ |
| 2026-01-09 | v1.0 | 初始版本，基于现有代码和文档梳理项目进度 | AI     |

---

**最后更新**: 2026-01-09  
**文档状态**: 📋 活跃维护中  
**问题反馈**: 请在项目 Issues 中提出
