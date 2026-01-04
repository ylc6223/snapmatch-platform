# 数据库表结构文档

> **最后更新**：2026-01-04
> **数据库类型**：MySQL
> **字符集**：utf8mb4

## 📋 概述

项目管理与照片交付模块包含2张核心表：

- `projects`：项目表（组织照片的容器）
- `photos`：照片表（照片元数据与选片状态）

## 🔧 执行SQL脚本

**方式1：使用数据库客户端工具（推荐）**

1. 打开你的数据库工具（Navicat、DBeaver、MySQL Workbench等）
2. 连接到 `snapmatch` 数据库
3. 新建查询窗口
4. 复制下方的 SQL 语句
5. 粘贴并执行

**方式2：命令行执行**

```bash
mysql -u root -p snapmatch
或者在 SQL 语句前加 USE snapmatch; 选择数据库
USE `cloud1-0g0w5fgq5ce8c980`;
# 然后粘贴下方的 SQL 语句
```

**验证表创建**：

```sql
-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESC projects;
DESC photos;

-- 查看索引
SHOW INDEX FROM projects;
SHOW INDEX FROM photos;
```

---

## 📊 表结构详情

### 1. projects 表（项目表）

**用途**：组织照片的核心实体，每次拍摄创建一个项目

| 字段          | 类型         | 说明                             | 默认值   |
| ------------- | ------------ | -------------------------------- | -------- |
| `_id`         | VARCHAR(34)  | 主键（set\_前缀+nanoid）         | -        |
| `name`        | VARCHAR(256) | 项目名称                         | -        |
| `description` | TEXT         | 项目描述                         | NULL     |
| `token`       | VARCHAR(64)  | 访问令牌（唯一）                 | -        |
| `expiresAt`   | BIGINT       | 过期时间戳（毫秒）               | NULL     |
| `status`      | VARCHAR(50)  | 状态（active/revoked/completed） | 'active' |
| `photoCount`  | INT          | 照片数量（冗余字段）             | 0        |
| `createdAt`   | BIGINT       | 创建时间（毫秒）                 | -        |
| `updatedAt`   | BIGINT       | 更新时间（毫秒）                 | -        |

**索引**：

- `PRIMARY KEY` (\_id)
- `UNIQUE KEY` (token)
- `INDEX` (status)
- `INDEX` (createdAt)

**SQL**：

```sql
CREATE TABLE IF NOT EXISTS projects (
  _id VARCHAR(34) PRIMARY KEY COMMENT '项目ID（set_前缀+nanoid）',
  name VARCHAR(256) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目描述',
  token VARCHAR(64) UNIQUE NOT NULL COMMENT '访问令牌（32位随机字符串）',
  expiresAt BIGINT COMMENT '过期时间戳（毫秒，可选）',
  status VARCHAR(50) DEFAULT 'active' COMMENT '项目状态：active/revoked/completed',
  photoCount INT DEFAULT 0 COMMENT '照片数量（冗余字段）',
  createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
  updatedAt BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',
  INDEX IDX_PROJECTS_TOKEN (token),
  INDEX IDX_PROJECTS_STATUS (status),
  INDEX IDX_PROJECTS_CREATED_AT (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';
```

---

### 2. photos 表（照片表）

**用途**：存储照片元数据，关联到项目

| 字段          | 类型         | 说明                               | 默认值       |
| ------------- | ------------ | ---------------------------------- | ------------ |
| `_id`         | VARCHAR(34)  | 主键（pho\_前缀+nanoid）           | -            |
| `projectId`   | VARCHAR(34)  | 项目ID（关联projects.\_id）        | -            |
| `filename`    | VARCHAR(512) | 原始文件名                         | -            |
| `originalKey` | VARCHAR(512) | R2原始文件键                       | -            |
| `previewKey`  | VARCHAR(512) | R2预览图键                         | -            |
| `thumbKey`    | VARCHAR(512) | R2缩略图键                         | NULL         |
| `fileSize`    | BIGINT       | 文件大小（字节）                   | NULL         |
| `width`       | INT          | 图片宽度（像素）                   | NULL         |
| `height`      | INT          | 图片高度（像素）                   | NULL         |
| `status`      | VARCHAR(50)  | 处理状态（processing/ready/error） | 'processing' |
| `selected`    | BOOLEAN      | 是否被客户选中                     | FALSE        |
| `selectedAt`  | BIGINT       | 选中的时间戳（毫秒）               | NULL         |
| `createdAt`   | BIGINT       | 创建时间（毫秒）                   | -            |

**索引**：

- `PRIMARY KEY` (\_id)
- `INDEX` (projectId)
- `INDEX` (selected)
- `INDEX` (status)

**SQL**：

```sql
CREATE TABLE IF NOT EXISTS photos (
  _id VARCHAR(34) PRIMARY KEY COMMENT '照片ID（pho_前缀+nanoid）',
  projectId VARCHAR(34) NOT NULL COMMENT '项目ID（外键关联，但无约束）',
  filename VARCHAR(512) NOT NULL COMMENT '原始文件名',
  originalKey VARCHAR(512) NOT NULL COMMENT 'R2原始文件键',
  previewKey VARCHAR(512) NOT NULL COMMENT 'R2预览图键',
  thumbKey VARCHAR(512) COMMENT 'R2缩略图键（可选）',
  fileSize BIGINT COMMENT '文件大小（字节）',
  width INT COMMENT '图片宽度（像素）',
  height INT COMMENT '图片高度（像素）',
  status VARCHAR(50) DEFAULT 'processing' COMMENT '处理状态：processing/ready/error',
  selected BOOLEAN DEFAULT FALSE COMMENT '是否被客户选中',
  selectedAt BIGINT COMMENT '选中的时间戳（毫秒）',
  createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
  INDEX IDX_PHOTOS_PROJECT_ID (projectId),
  INDEX IDX_PHOTOS_SELECTED (selected),
  INDEX IDX_PHOTOS_STATUS (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='照片表';
```

---

## 🔑 关键设计决策

### 决策1：主键使用 VARCHAR(34)

**格式**：`{前缀}_{nanoid(16)}`

- Project: `set_01ARZ3NDEKTSV4RRFFQ69G5FAV`
- Photo: `pho_01ARZ3NDEKTSV4RRFFQ69G5FAV`

**原因**：

- ✅ 更安全：不暴露记录数量
- ✅ 分布式友好：可提前生成
- ✅ 包含语义：前缀便于识别

### 决策2：时间字段使用 BIGINT

**存储**：毫秒时间戳（JavaScript Date.now()）

**原因**：

- ✅ 与 JavaScript 直接兼容
- ✅ 跨时区更安全
- ✅ 便于计算

### 决策3：冗余 photoCount 字段

**维护策略**：

- 上传照片后：`UPDATE projects SET photoCount = photoCount + 1 WHERE _id = ?`
- 删除照片后：`UPDATE projects SET photoCount = photoCount - 1 WHERE _id = ?`

**原因**：

- ✅ 查询性能：避免每次 COUNT(\*)
- ✅ 用户体验：快速显示照片数量

### 决策4：不使用外键约束

**原因**：

- ✅ 性能考虑：避免外键检查开销
- ✅ 灵活性：便于删除和重组数据
- ✅ 分布式友好

**风险控制**：

- 应用层严格校验
- 重要操作使用事务

### 决策5：selected 字段直接在 photos 表

**当前方案**（MVP）：

```sql
selected BOOLEAN DEFAULT FALSE
```

**局限**：

- ❌ 不支持多选类型（喜欢/入册/精修）
- ❌ 不支持修改历史

**后续扩展**：
如需多选类型，创建 `selections` 表：

```sql
CREATE TABLE selections (
  _id VARCHAR(34) PRIMARY KEY,
  photoId VARCHAR(34) NOT NULL,
  selectionType VARCHAR(50), -- 'favorite', 'album', 'retouch'
  createdAt BIGINT NOT NULL
);
```

---

## 📝 维护说明

### 添加新表

**方式1：创建新的 SQL 文件**

```bash
# 1. 创建新的 SQL 文件
touch apps/backend/scripts/add-customers-table.sql

# 2. 编写建表语句
# 3. 执行
mysql -u root -p snapmatch < scripts/add-customers-table.sql

# 4. 更新本文档
```

**方式2：直接在现有文件追加**

```bash
# 1. 编辑 create-tables.sql
vim apps/backend/scripts/create-tables.sql

# 2. 添加新表的 CREATE TABLE 语句

# 3. 重新执行整个文件（因为使用了 IF NOT EXISTS）
mysql -u root -p snapmatch < scripts/create-tables.sql
```

### 添加新字段

```sql
-- 示例：给 projects 表添加 avatarUrl 字段
ALTER TABLE projects
ADD COLUMN avatarUrl VARCHAR(512) COMMENT '项目封面图URL' AFTER description;
```

### 添加索引

```sql
-- 示例：给 photos 表添加复合索引
ALTER TABLE photos
ADD INDEX IDX_PHOTOS_PROJECT_SELECTED (projectId, selected);
```

### 清理表（开发环境）

```sql
-- ⚠️ 仅限开发环境使用！
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS projects;
```

---

## 🔍 常用查询示例

### 查询项目的所有照片

```sql
SELECT
  p._id,
  p.filename,
  p.selected,
  p.selectedAt
FROM photos p
WHERE p.projectId = 'set_01ARZ3NDEKTSV4RRFFQ69G5FAV'
ORDER BY p.createdAt DESC;
```

### 查询项目及照片数量

```sql
SELECT
  _id,
  name,
  token,
  status,
  photoCount,
  createdAt
FROM projects
WHERE status = 'active'
ORDER BY createdAt DESC;
```

### 查询客户已选照片

```sql
SELECT
  p._id,
  p.filename,
  p.previewKey,
  p.selectedAt
FROM photos p
WHERE p.projectId = 'set_...'
  AND p.selected = TRUE
ORDER BY p.selectedAt ASC;
```

---

## ✅ 验证清单

执行完 SQL 后，请验证：

- [ ] `projects` 表已创建
- [ ] `photos` 表已创建
- [ ] `projects.token` 有 UNIQUE 约束
- [ ] `photos.projectId` 有索引
- [ ] `photos.selected` 有索引
- [ ] 字符集为 utf8mb4
- [ ] 引擎为 InnoDB

**验证命令**：

```sql
-- 查看所有表
SHOW TABLES;

-- 查看表状态
SHOW TABLE STATUS WHERE Name IN ('projects', 'photos');

-- 查看表结构
DESC projects;
DESC photos;

-- 查看索引
SHOW INDEX FROM projects;
SHOW INDEX FROM photos;

-- 查看创建语句
SHOW CREATE TABLE projects;
SHOW CREATE TABLE photos;
```

---

## 📚 相关文档

- [实体定义](../database/entities/project.entity.ts)
- [实体定义](../database/entities/photo.entity.ts)
- [后端API实现](./02-backend-implementation.md)
