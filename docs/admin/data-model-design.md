# SnapMatch 管理后台 - 数据模型设计文档

> **创建日期**: 2026-01-04
> **最后更新**: 2026-01-04
> **基于需求**: 用户澄清后的实际业务需求

---

## 📋 目录

1. [业务需求澄清](#业务需求澄清)
2. [实体关系图](#实体关系图)
3. [实体详细设计](#实体详细设计)
4. [数据库表结构](#数据库表结构)
5. [实施计划](#实施计划)

---

## 业务需求澄清

### 🎯 角色简化

**实际角色**（比 PRD 简化）：

- ✅ **摄影师/管理员**：内部员工，拥有所有权限
- ✅ **客户**：外部用户，只能访问自己的选片链接
- ❌ ~~销售/客服~~：不需要
- ❌ ~~修图师~~：不需要单独角色（由摄影师兼任）

### 📸 选片标记

**选择**：完整版（3 种标记）

- **喜欢（liked）**：客户快速浏览时标记喜欢，用于初步筛选
- **入册（in_album）**：确定要放进相册的照片，有套餐张数限制
- **精修（retouch）**：需要重点精修的照片，有套餐张数限制

**套餐约束示例**：

- 套餐 A：精修 10 张 + 入册 30 张
- 如果客户选了 15 张精修、35 张入册 → 需要额外付费

### 🖼️ 照片处理方案

**选择**：方案 A - 前端生成

- 前端上传前用 Canvas 生成：
  - `originalKey` - 原图（20MB）
  - `previewKey` - 预览图（500KB，带水印）
  - `thumbKey` - 缩略图（50KB）
- 后端只记录 3 个文件路径
- **费用**：约 $0.31/月（只付 R2 存储费）
- **优点**：零额外费用，快速上线

### 📁 相册分组

**选择**：不需要 Album

- 所有照片平铺在一个列表
- 简化实现，符合当前业务需求

### 🔄 项目流程

**选择**：完整流程

1. 创建项目 → 2. 上传照片 → 3. 客户选片 → 4. 提交选片（锁定）
   → 5. 上传精修图 → 6. 客户确认 → 7. 已交付

### 🔗 Viewer 链接

**选择**：一个项目一个链接

- Project 自带 `token` 字段
- 简化设计，无需单独的 ViewerLink 实体

---

## 实体关系图

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Customer    │ 1     N │  Project    │ 1     N │   Photo     │
│ (客户)      │─────────││  (项目)     │─────────││  (照片)     │
└─────────────┘         └─────────────┘         └─────────────┘
                                │
                                │ 1
                                │
                                │ N
                         ┌─────────────┐
                         │  Package    │
                         │  (套餐)      │
                         └─────────────┘

┌─────────────┐         ┌─────────────┐
│ Selection   │ N     1 │  Project    │
│ (选片记录)  │─────────││  (项目)     │
└─────────────┘         └─────────────┘
       │
       │ N
       │
┌─────────────┐
│ SelectionItem│
│ (选片项)    │
└─────────────┘
```

---

## 实体详细设计

### 1. CustomerEntity（客户档案）

**用途**：管理客户基本信息

**字段**：

- `id` - 主键（`cus_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- `name` - 姓名
- `phone` - 手机号（唯一）
- `wechatOpenId` - 微信 OpenID（可选）
- `email` - 邮箱（可选）
- `notes` - 备注说明
- `tags` - 标签数组（JSON）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**关系**：

- 一对多 → Project（一个客户可以有多个项目）

---

### 2. PackageEntity（套餐配置）

**用途**：定义套餐内容和价格

**字段**：

- `id` - 主键（`pkg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
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
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**关系**：

- 一对多 → Project（一个套餐可以被多个项目使用）

---

### 3. ProjectEntity（项目）

**用途**：核心业务实体，管理一次拍摄项目

**状态机**：

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

**字段**：

- `id` - 主键（`prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- `name` - 项目名称
- `description` - 项目描述
- `customerId` - 客户 ID（外键）
- `packageId` - 套餐 ID（外键）
- `shootDate` - 拍摄日期（时间戳）
- `token` - Viewer 访问 Token（唯一）
- `expiresAt` - Token 过期时间（null = 永不过期）
- `status` - 项目状态（枚举）
- `allowDownloadOriginal` - 是否允许下载原图
- `watermarkEnabled` - 是否开启水印（默认 true）
- `selectionDeadline` - 选片截止日期
- `photoCount` - 照片总数
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**关系**：

- 多对一 → Customer
- 多对一 → Package
- 一对多 → Photo
- 一对多 → Selection

---

### 4. PhotoEntity（照片）

**用途**：记录照片信息和存储路径

**状态**：

- `PROCESSING` - 处理中
- `READY` - 就绪
- `FAILED` - 失败

**字段**：

- `id` - 主键（`pho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- `projectId` - 项目 ID（外键）
- `filename` - 原始文件名
- `originalKey` - 原图存储 Key
- `previewKey` - 预览图存储 Key（带水印）
- `thumbKey` - 缩略图存储 Key
- `retouchedKey` - 精修图存储 Key（null = 未上传）
- `retouchedPreviewKey` - 精修预览图存储 Key（带水印）
- `fileSize` - 文件大小（字节）
- `width` - 图片宽度（像素）
- `height` - 图片高度（像素）
- `exif` - EXIF 信息（JSON）
- `status` - 处理状态（枚举）
- `createdAt` - 创建时间

**关系**：

- 多对一 → Project

**前端生成方案**：

1. 用户选择原图（20MB）
2. 前端 Canvas 处理：
   - 生成 `previewKey`（1200x800，500KB，加水印）
   - 生成 `thumbKey`（200x200，50KB）
3. 一次性上传 3 个文件到 R2
4. 后端记录 3 个 Key

---

### 5. SelectionEntity（选片记录）

**用途**：记录客户的选片结果

**状态**：

- `DRAFT` - 草稿（可修改）
- `SUBMITTED` - 已提交（锁定）
- `LOCKED` - 已锁定（最终确认）

**选片标记**：

- `LIKED` - 喜欢
- `IN_ALBUM` - 入册
- `RETOUCH` - 精修

**字段**：

- `id` - 主键（`sel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- `projectId` - 项目 ID（外键）
- `customerId` - 客户 ID（外键）
- `status` - 选片状态（枚举）
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
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**关系**：

- 多对一 → Project
- 多对一 → Customer

**套餐检查逻辑**：

```typescript
// 检查是否超额
const extraRetouch = Math.max(0, selection.retouchCount - project.package.includedRetouchCount);
const extraAlbum = Math.max(0, selection.inAlbumCount - project.package.includedAlbumCount);

const extraCost =
  extraRetouch * project.package.extraRetouchPrice + extraAlbum * project.package.extraAlbumPrice;
```

---

## 数据库表结构

> **详细的 SQL 建表脚本请查看**: [sql-scripts.md](./sql-scripts.md)

### 表清单

1. ✅ `customers` - 客户表
2. ✅ `packages` - 套餐表
3. ✅ `projects` - 项目表
4. ✅ `photos` - 照片表
5. ✅ `selections` - 选片记录表

### 索引建议

```sql
-- projects 表
CREATE INDEX idx_projects_customer ON projects(customerId);
CREATE INDEX idx_projects_package ON projects(packageId);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_token ON projects(token);

-- photos 表
CREATE INDEX idx_photos_project ON photos(projectId);
CREATE INDEX idx_photos_status ON photos(status);

-- selections 表
CREATE INDEX idx_selections_project ON selections(projectId);
CREATE INDEX idx_selections_customer ON selections(customerId);
CREATE INDEX idx_selections_status ON selections(status);
```

---

## 实施计划

### 阶段 1：数据库创建 ✅

- [x] 设计所有实体
- [x] 创建 Entity 文件
- [x] 注册到数据库模块
- [x] 编写 SQL 建表脚本

### 阶段 2：基础 CRUD 接口（2-3 天）

**优先级：P0**

#### 2.1 套餐管理

- [ ] `GET /api/packages` - 套餐列表
- [ ] `POST /api/packages` - 创建套餐
- [ ] `GET /api/packages/:id` - 套餐详情
- [ ] `PATCH /api/packages/:id` - 更新套餐
- [ ] `DELETE /api/packages/:id` - 删除套餐

#### 2.2 客户管理

- [ ] `GET /api/customers` - 客户列表
- [ ] `POST /api/customers` - 创建客户
- [ ] `GET /api/customers/:id` - 客户详情
- [ ] `PATCH /api/customers/:id` - 更新客户
- [ ] `DELETE /api/customers/:id` - 删除客户

#### 2.3 项目管理（更新）

- [ ] 更新 `POST /api/projects` - 添加 customerId、packageId 等字段
- [ ] 更新 `PATCH /api/projects/:id` - 支持状态流转
- [ ] `POST /api/projects/:id/status` - 状态变更接口

### 阶段 3：照片上传完整流程（3-4 天）

**优先级：P0**

#### 3.1 照片上传确认

- [ ] `POST /api/photos/confirm` - 上传完成确认
  - 保存照片元数据到 Photo 表
  - 返回处理状态

#### 3.2 照片查询

- [ ] `GET /api/projects/:id/photos` - 照片列表（分页）
- [ ] `GET /api/photos/:id` - 照片详情
- [ ] `DELETE /api/photos/:id` - 删除照片

#### 3.3 前端集成

- [ ] 更新项目创建表单（添加客户、套餐选择）
- [ ] 照片上传完整流程（上传 3 个规格 + 确认）

### 阶段 4：选片功能（4-5 天）

**优先级：P0**

#### 4.1 Viewer 访问

- [ ] `GET /api/viewer/:token` - 获取选片信息
  - 验证 token
  - 返回项目信息 + 预览图列表 + 套餐规则
- [ ] `GET /api/viewer/:token/photos` - 照片列表（分页）

#### 4.2 选片操作

- [ ] `PUT /api/viewer/:token/selection` - 保存选片草稿（幂等）
- [ ] `POST /api/viewer/:token/submit` - 提交选片（锁定）

#### 4.3 前端 Viewer

- [ ] Viewer 访问页（/client/selection/[uuid]）
- [ ] 照片浏览（瀑布流/大图模式）
- [ ] 选片标记（喜欢/入册/精修）
- [ ] 提交确认

### 阶段 5：精修交付流程（3-4 天）

**优先级：P1**

#### 5.1 精修图上传

- [ ] `POST /api/projects/:id/retouched` - 上传精修图
  - 批量上传
  - 与选片结果对齐
  - 生成精修预览图（前端加水印）

#### 5.2 客户确认

- [ ] `POST /api/projects/:id/retouched/confirm` - 客户确认
- [ ] `GET /api/viewer/:token/retouched` - 查看精修图

#### 5.3 前端集成

- [ ] 精修上传页（展示选片结果）
- [ ] 精修预览页
- [ ] 确认按钮

---

## 技术决策总结

| 决策点          | 选择                       | 理由                     |
| --------------- | -------------------------- | ------------------------ |
| **角色模型**    | 简化为 2 种（管理员+客户） | 符合当前业务，减少复杂度 |
| **选片标记**    | 完整版（3 种）             | 灵活支持套餐约束         |
| **照片处理**    | 前端生成                   | 零额外费用，快速上线     |
| **相册分组**    | 不需要                     | 简化实现                 |
| **项目流程**    | 完整流程（7 个状态）       | 支持精修交付闭环         |
| **Viewer 链接** | 一个项目一个链接           | 简化设计                 |

---

## 下一步

1. **运行 SQL 建表脚本**：[sql-scripts.md](./sql-scripts.md)
2. **开始开发接口**：从套餐管理开始
3. **前端集成**：逐步实现项目创建、照片上传、选片功能

---

**文档维护者**: 开发团队
**最后更新**: 2026-01-04
