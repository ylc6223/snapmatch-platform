# 数据库迁移指南

本目录用于存放 TypeORM 数据库迁移脚本。

## 📋 待创建的表

根据新的数据模型，需要创建以下表：

### 1. customers（客户表）

```sql
CREATE TABLE customers (
  _id VARCHAR(34) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  wechatOpenId VARCHAR(64) NULL,
  email VARCHAR(256) NULL,
  notes TEXT NULL,
  tags JSON NULL,
  createdAt BIGINT NOT NULL,
  updatedAt BIGINT NOT NULL
);
```

### 2. packages（套餐表）

```sql
CREATE TABLE packages (
  _id VARCHAR(34) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  includedRetouchCount INT DEFAULT 0,
  includedAlbumCount INT DEFAULT 0,
  includeAllOriginals BOOLEAN DEFAULT FALSE,
  price INT NULL,
  extraRetouchPrice INT DEFAULT 0,
  extraAlbumPrice INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  sort INT DEFAULT 0,
  createdAt BIGINT NOT NULL,
  updatedAt BIGINT NOT NULL
);
```

### 3. projects（项目表）- 需要更新

```sql
ALTER TABLE projects
ADD COLUMN customerId VARCHAR(34) NOT NULL,
ADD COLUMN packageId VARCHAR(34) NOT NULL,
ADD COLUMN shootDate BIGINT NULL,
ADD COLUMN status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN allowDownloadOriginal BOOLEAN DEFAULT FALSE,
ADD COLUMN watermarkEnabled BOOLEAN DEFAULT TRUE,
ADD COLUMN selectionDeadline BIGINT NULL;

-- 添加外键约束
ALTER TABLE projects
ADD CONSTRAINT fk_project_customer
FOREIGN KEY (customerId) REFERENCES customers(_id);

ALTER TABLE projects
ADD CONSTRAINT fk_project_package
FOREIGN KEY (packageId) REFERENCES packages(_id);
```

### 4. photos（照片表）- 需要更新

```sql
ALTER TABLE photos
ADD COLUMN retouchedKey VARCHAR(512) NULL,
ADD COLUMN retouchedPreviewKey VARCHAR(512) NULL,
ADD COLUMN exif JSON NULL,
MODIFY COLUMN status ENUM('processing', 'ready', 'failed') DEFAULT 'processing';

-- 移除废弃的字段
ALTER TABLE photos
DROP COLUMN selected,
DROP COLUMN selectedAt;
```

### 5. selections（选片记录表）

```sql
CREATE TABLE selections (
  _id VARCHAR(34) PRIMARY KEY,
  projectId VARCHAR(34) NOT NULL,
  customerId VARCHAR(34) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  items JSON NOT NULL,
  likedCount INT DEFAULT 0,
  inAlbumCount INT DEFAULT 0,
  retouchCount INT DEFAULT 0,
  submittedAt BIGINT NULL,
  createdAt BIGINT NOT NULL,
  updatedAt BIGINT NOT NULL,

  FOREIGN KEY (projectId) REFERENCES projects(_id),
  FOREIGN KEY (customerId) REFERENCES customers(_id)
);
```

## 🚀 如何创建迁移

### 方式 1：使用 TypeORM CLI（推荐）

```bash
# 1. 生成迁移文件
cd apps/backend
npm run typeorm migration:generate -- -d src/database/migrations

# 2. 运行迁移
npm run typeorm migration:run

# 3. 回滚迁移
npm run typeorm migration:revert
```

### 方式 2：手动创建迁移

在 `migrations` 目录下创建文件，如 `1704350000000-InitialSetup.ts`：

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1704350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建表
    await queryRunner.query(`
      CREATE TABLE customers (
        _id VARCHAR(34) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        ...
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚
    await queryRunner.query(`DROP TABLE customers`);
  }
}
```

## 📝 迁移文件命名规范

```
{Timestamp}-{Description}.ts
例如：1704350000000-CreateCustomersTable.ts
```

## ⚠️ 注意事项

1. **开发环境**：可以设置 `synchronize: true` 自动同步（仅开发）
2. **生产环境**：必须使用迁移脚本，禁止使用 synchronize
3. **备份数据**：运行迁移前务必备份数据库
4. **测试迁移**：在测试环境先运行迁移脚本

## 🔗 相关文档

- [TypeORM Migrations](https://typeorm.io/#/migrations)
- [MySQL Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
