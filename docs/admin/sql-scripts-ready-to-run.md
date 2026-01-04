# SnapMatch 管理后台 - 可直接执行的 SQL 脚本

> **创建日期**: 2026-01-04
> **说明**: 本脚本包含所有建表语句，可以直接在 MySQL 工具中执行
> **注意**: 如果表已存在，相关语句会报错，可以忽略（Duplicate column name 或 Table already exists）

---

## 📋 执行顺序说明

1. 创建数据库
2. 创建新表（customers, packages, projects, photos, selections）
3. 更新现有表（rbac_users）
4. 插入初始数据

---

## 1️⃣ 创建数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS snapmatch
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE snapmatch;
```

---

## 2️⃣ 创建客户表（customers）

```sql
-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    _id VARCHAR(34) PRIMARY KEY COMMENT '主键 ID',
    name VARCHAR(128) NOT NULL COMMENT '客户姓名',
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
    wechatOpenId VARCHAR(64) NULL COMMENT '微信 OpenID',
    email VARCHAR(256) NULL COMMENT '邮箱',
    notes TEXT NULL COMMENT '备注说明',
    tags JSON NULL COMMENT '标签数组',
    createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
    updatedAt BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',

    INDEX idx_phone (phone),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户档案表';
```

---

## 3️⃣ 创建套餐表（packages）

```sql
-- 套餐表
CREATE TABLE IF NOT EXISTS packages (
    _id VARCHAR(34) PRIMARY KEY COMMENT '主键 ID',
    name VARCHAR(128) NOT NULL COMMENT '套餐名称',
    description TEXT NULL COMMENT '套餐描述',
    includedRetouchCount INT NOT NULL DEFAULT 0 COMMENT '包含精修张数',
    includedAlbumCount INT NOT NULL DEFAULT 0 COMMENT '包含入册张数',
    includeAllOriginals BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否底片全送',
    price INT NULL COMMENT '套餐价格（分）',
    extraRetouchPrice INT NOT NULL DEFAULT 0 COMMENT '超额精修单价（分/张）',
    extraAlbumPrice INT NOT NULL DEFAULT 0 COMMENT '超额入册单价（分/张）',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序',
    createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
    updatedAt BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',

    INDEX idx_isActive (isActive),
    INDEX idx_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='套餐配置表';
```

---

## 4️⃣ 创建项目表（projects）

```sql
-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    _id VARCHAR(34) PRIMARY KEY COMMENT '主键 ID',
    name VARCHAR(256) NOT NULL COMMENT '项目名称',
    description TEXT NULL COMMENT '项目描述',
    customerId VARCHAR(34) NOT NULL COMMENT '客户 ID',
    packageId VARCHAR(34) NOT NULL COMMENT '套餐 ID',
    shootDate BIGINT NULL COMMENT '拍摄日期（毫秒时间戳）',
    token VARCHAR(64) UNIQUE NOT NULL COMMENT 'Viewer 访问 Token',
    expiresAt BIGINT NULL COMMENT 'Token 过期时间（毫秒时间戳，null=永不过期）',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '项目状态',
    allowDownloadOriginal BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否允许下载原图',
    watermarkEnabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否开启水印',
    selectionDeadline BIGINT NULL COMMENT '选片截止日期（毫秒时间戳）',
    photoCount INT NOT NULL DEFAULT 0 COMMENT '照片总数',
    createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
    updatedAt BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',

    INDEX idx_customerId (customerId),
    INDEX idx_packageId (packageId),
    INDEX idx_status (status),
    INDEX idx_token (token),
    INDEX idx_createdAt (createdAt),

    CONSTRAINT fk_project_customer
        FOREIGN KEY (customerId)
        REFERENCES customers(_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_project_package
        FOREIGN KEY (packageId)
        REFERENCES packages(_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='项目表';
```

---

## 5️⃣ 创建照片表（photos）

```sql
-- 照片表
CREATE TABLE IF NOT EXISTS photos (
    _id VARCHAR(34) PRIMARY KEY COMMENT '主键 ID',
    projectId VARCHAR(34) NOT NULL COMMENT '项目 ID',
    filename VARCHAR(512) NOT NULL COMMENT '原始文件名',
    originalKey VARCHAR(512) NOT NULL COMMENT '原图存储 Key',
    previewKey VARCHAR(512) NOT NULL COMMENT '预览图存储 Key（带水印）',
    thumbKey VARCHAR(512) NULL COMMENT '缩略图存储 Key',
    retouchedKey VARCHAR(512) NULL COMMENT '精修图存储 Key',
    retouchedPreviewKey VARCHAR(512) NULL COMMENT '精修预览图存储 Key（带水印）',
    fileSize BIGINT NULL COMMENT '文件大小（字节）',
    width INT NULL COMMENT '图片宽度（像素）',
    height INT NULL COMMENT '图片高度（像素）',
    exif JSON NULL COMMENT 'EXIF 信息',
    status VARCHAR(50) NOT NULL DEFAULT 'processing' COMMENT '处理状态',
    createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',

    INDEX idx_projectId (projectId),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt),

    CONSTRAINT fk_photo_project
        FOREIGN KEY (projectId)
        REFERENCES projects(_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='照片表';
```

---

## 6️⃣ 创建选片记录表（selections）

```sql
-- 选片记录表
CREATE TABLE IF NOT EXISTS selections (
    _id VARCHAR(34) PRIMARY KEY COMMENT '主键 ID',
    projectId VARCHAR(34) NOT NULL COMMENT '项目 ID',
    customerId VARCHAR(34) NOT NULL COMMENT '客户 ID',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT '选片状态',
    items JSON NOT NULL COMMENT '选片项数组',
    likedCount INT NOT NULL DEFAULT 0 COMMENT '喜欢数量',
    inAlbumCount INT NOT NULL DEFAULT 0 COMMENT '入册数量',
    retouchCount INT NOT NULL DEFAULT 0 COMMENT '精修数量',
    submittedAt BIGINT NULL COMMENT '提交时间（毫秒时间戳）',
    createdAt BIGINT NOT NULL COMMENT '创建时间（毫秒时间戳）',
    updatedAt BIGINT NOT NULL COMMENT '更新时间（毫秒时间戳）',

    INDEX idx_projectId (projectId),
    INDEX idx_customerId (customerId),
    INDEX idx_status (status),
    INDEX idx_submittedAt (submittedAt),

    CONSTRAINT fk_selection_project
        FOREIGN KEY (projectId)
        REFERENCES projects(_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_selection_customer
        FOREIGN KEY (customerId)
        REFERENCES customers(_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='选片记录表';
```

---

## 7️⃣ 更新 RBAC 用户表（rbac_users）

**重要**：如果表已存在且已有数据，请先备份！

```sql
-- 备份命令（在命令行执行）
-- mysqldump -u root -p snapmatch rbac_users > rbac_users_backup.sql

-- 更新表结构
ALTER TABLE rbac_users
    ADD COLUMN phone VARCHAR(20) UNIQUE NULL AFTER account,
    ADD COLUMN customerId VARCHAR(34) NULL AFTER phone;

-- 添加外键约束
ALTER TABLE rbac_users
    ADD CONSTRAINT fk_rbac_user_customer
        FOREIGN KEY (customerId)
        REFERENCES customers(_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 添加索引
ALTER TABLE rbac_users
    ADD INDEX idx_phone (phone),
    ADD INDEX idx_customerId (customerId);

-- 删除旧字段
ALTER TABLE rbac_users
    DROP COLUMN userType;
```

---

## 8️⃣ 插入初始数据

### 8.1 插入默认套餐

```sql
INSERT INTO packages (_id, name, description, includedRetouchCount, includedAlbumCount, includeAllOriginals, price, extraRetouchPrice, extraAlbumPrice, isActive, sort, createdAt, updatedAt) VALUES
('pkg_01aaaaaaaaaaaaaaaaaaaaaaaaaa', '基础套餐', '包含 10 张精修，30 张入册', 10, 30, FALSE, 98000, 5000, 2000, TRUE, 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
('pkg_01bbbbbbbbbbbbbbbbbbbbbbbbbb', '标准套餐', '包含 20 张精修，50 张入册', 20, 50, FALSE, 16800, 4000, 1500, TRUE, 2, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
('pkg_01cccccccccccccccccccccccccc', '豪华套餐', '包含 30 张精修，80 张入册，底片全送', 30, 80, TRUE, 29800, 3000, 1000, TRUE, 3, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);
```

### 8.2 插入测试客户（可选）

```sql
INSERT INTO customers (_id, name, phone, email, notes, tags, createdAt, updatedAt) VALUES
('cus_01aaaaaaaaaaaaaaaaaaaaaaaaaa', '张三', '13800138000', 'zhangsan@example.com', 'VIP 客户', '["VIP", "老客户"]', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
('cus_01bbbbbbbbbbbbbbbbbbbbbbbbbb', '李四', '13800138001', NULL, NULL, NULL, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);
```

### 8.3 插入测试管理员账号（可选）

```sql
-- 注意：密码是 'admin123' 的 bcrypt 哈希
-- 实际使用时请修改为你自己的密码哈希
INSERT INTO rbac_users (_id, account, passwordHash, role, customerId, status, createdAt, updatedAt) VALUES
('usr_admin01', 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', NULL, 'active', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);
```

---

## 9️⃣ 验证表结构

执行完所有 SQL 后，运行以下语句验证：

```sql
-- 查看所有表
SHOW TABLES;

-- 验证 customers 表
DESC customers;

-- 验证 packages 表
DESC packages;

-- 验证 projects 表
DESC projects;

-- 验证 photos 表
DESC photos;

-- 验证 selections 表
DESC selections;

-- 验证 rbac_users 表
DESC rbac_users;
```

---

## 🔧 常见错误处理

### 错误 1：Duplicate column name

**现象**：

```
ERROR 1060 (42S22): Duplicate column name 'customerId'
```

**原因**：列已存在，说明之前已经执行过这个语句了

**解决**：可以忽略，继续执行后面的语句

---

### 错误 2：Table already exists

**现象**：

```
ERROR 1050 (42S01): Table 'customers' already exists
```

**原因**：表已存在

**解决**：可以忽略，继续执行后面的语句

---

### 错误 3：Foreign key constraint is incorrectly formed

**现象**：

```
ERROR 1005 (HY000): Can't create table `snapmatch`.`projects`
(errno: 150 'Foreign key constraint is incorrectly formed')
```

**原因**：外键引用的表不存在

**解决**：确保按顺序执行 SQL（customers → packages → projects → photos → selections）

---

## ✅ 执行检查清单

- [ ] 创建数据库 snapmatch
- [ ] 创建 customers 表
- [ ] 创建 packages 表
- [ ] 创建 projects 表
- [ ] 创建 photos 表
- [ ] 创建 selections 表
- [ ] 更新 rbac_users 表
- [ ] 插入默认套餐数据
- [ ] 验证所有表结构

---

**文档维护者**: 开发团队
**最后更新**: 2026-01-04
