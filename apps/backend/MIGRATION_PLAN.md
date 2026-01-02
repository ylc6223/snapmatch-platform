# CloudBase MySQL 到本地 MySQL 数据库迁移方案

## 📋 文档信息

- **项目名称**: Snapmatch Backend
- **迁移目标**: 从腾讯云 CloudBase MySQL（托管）迁移到本地/自建 MySQL 数据库
- **当前架构**: CloudBase MySQL + 数据模型 ORM
- **目标架构**: 自建 MySQL + TypeORM
- **创建日期**: 2026-01-02
- **预计周期**: 2-3 周（简化后）
- **风险评估**: 低风险（相同数据库类型）

---

## 📊 项目概述

### 当前架构澄清

```
┌─────────────────────────────────────┐
│  CloudBase MySQL (托管)              │
│  - 地址: 10.12.105.55:3306           │
│  - 数据库: cloud1-0g0w5fgq5ce8c980  │
│  - 7张表（rbac_users等）              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  数据模型 ORM (腾讯封装)             │
│  - @cloudbase/node-sdk              │
│  - 类型校验、关系管理                │
│  - app.models.tableName.list()      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  你的 NestJS 应用                   │
│  - CloudBaseUsersRepository         │
│  - CloudBaseAuthSessionsRepository  │
└─────────────────────────────────────┘
```

### 目标架构

```
┌─────────────────────────────────────┐
│  自建 MySQL (本地/云服务器)          │
│  - 地址: localhost:3306             │
│  - 数据库: snapmatch                 │
│  - 相同的7张表结构                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  TypeORM (开源 ORM)                 │
│  - @nestjs/typeorm                  │
│  - 类型安全、Active Record/Data Mapper │
│  - repository.save() / query()      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  你的 NestJS 应用                   │
│  - MySQLUsersRepository             │
│  - MySQLAuthSessionsRepository      │
└─────────────────────────────────────┘
```

### 关键信息

| 项目         | 当前状态                     | 目标状态   |
| ------------ | ---------------------------- | ---------- |
| **数据库**   | CloudBase MySQL (托管)       | 自建 MySQL |
| **ORM**      | 腾讯数据模型                 | TypeORM    |
| **迁移策略** | 导出后完全替换               | -          |
| **数据处理** | 迁移所有现有数据             | -          |
| **表结构**   | **复用现有结构**，不重新设计 | -          |

---

## ✅ 可行性分析

### 迁移完全可行且更简单

**优势:**

1. **数据库类型相同**: 都是 MySQL，表结构可以直接复用
2. **已有 ORM 经验**: 从腾讯 ORM 迁移到 TypeORM，概念相通
3. **直接连接访问**: 可以直接通过 MySQL 连接访问 CloudBase 数据库
4. **Repository 模式**: 项目采用 Repository 接口模式，易于切换实现
5. **类型安全**: TypeScript 类型定义完善，降低迁移风险

### 迁移优势对比

| 对比项         | 原方案假设      | 实际方案           |
| -------------- | --------------- | ------------------ |
| **数据源**     | CloudBase NoSQL | CloudBase MySQL ✅ |
| **表结构**     | 需要重新设计    | 直接导出复用 ✅    |
| **数据类型**   | 需要映射转换    | 完全一致 ✅        |
| **查询语法**   | 需要改写        | 几乎不变 ✅        |
| **迁移复杂度** | 高              | **低很多** ✅      |

### 挑战与应对

| 挑战                           | 应对方案                              |
| ------------------------------ | ------------------------------------- |
| ORM 差异（腾讯 ORM → TypeORM） | Repository 接口隔离，直接替换实现     |
| SQL 语法细微差异               | 几乎无差异，主要在占位符 `{{}}` → `?` |
| 数据一致性                     | 数据迁移后校验验证                    |
| 业务中断风险                   | 选择低峰期迁移，准备快速回滚方案      |

---

## 🛠️ 技术选型

### ORM 框架: TypeORM

**选择理由:**

- NestJS 官方推荐，生态成熟
- TypeScript 原生支持，类型安全
- Repository 模式与现有架构完美契合
- 支持从现有数据库生成实体（简化开发）

### 迁移策略: 直接替换

由于项目采用 Repository 接口模式，可以直接替换底层实现：

```typescript
// 替换前：使用 CloudBase
CloudBaseUsersRepository implements UsersRepository

// 替换后：使用 TypeORM + MySQL
MySQLUsersRepository implements UsersRepository

// 业务层代码无需修改
UsersService {
  constructor(@Inject(USERS_REPOSITORY) private repo: UsersRepository) {}
}
```

**优势:**

- 业务层代码完全不变
- 接口契约保证兼容性
- 一次性切换，简单直接

---

## 🗄️ 数据库设计

### 重要说明：复用现有表结构

**不需要重新设计表结构！** 直接从 CloudBase MySQL 导出即可。

但为了便于理解表结构和验证迁移结果，以下是参考 DDL：

### CloudBase MySQL 连接信息

```
Host: 10.12.105.55
Port: 3306
User: manage
Password: [YOUR-PASSWORD]
Database: cloud1-0g0w5fgq5ce8c980
```

### 现有表清单

根据项目代码，包含以下 7 张表：

1. `rbac_users` - 用户表
2. `rbac_roles` - 角色表
3. `rbac_permissions` - 权限表
4. `rbac_user_roles` - 用户角色关联表
5. `rbac_role_permissions` - 角色权限关联表
6. `rbac_role_data_scopes` - 角色数据范围表
7. `auth_sessions` - 认证会话表

### 参考表结构 (DDL)

以下 DDL 用于理解表结构设计，实际迁移时使用 mysqldump 导出。

```sql
-- ========================================
-- 1. 用户表 (rbac_users)
-- ========================================
CREATE TABLE `rbac_users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `account` VARCHAR(255) NOT NULL COMMENT '账号(小写)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `user_type` VARCHAR(50) NOT NULL DEFAULT 'customer' COMMENT '用户类型: photographer/sales/customer',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_account` (`account`),
  KEY `idx_status` (`status`),
  KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 2. 角色表 (rbac_roles)
-- ========================================
CREATE TABLE `rbac_roles` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `code` VARCHAR(100) NOT NULL COMMENT '角色代码: admin/photographer/sales/customer',
  `name` VARCHAR(255) NOT NULL COMMENT '角色名称',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ========================================
-- 3. 权限表 (rbac_permissions)
-- ========================================
CREATE TABLE `rbac_permissions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `code` VARCHAR(255) NOT NULL COMMENT '权限代码: page:dashboard, assets:read等',
  `type` VARCHAR(50) NOT NULL COMMENT '权限类型: page/action/data',
  `resource` VARCHAR(100) NOT NULL COMMENT '资源名称: dashboard, assets等',
  `action` VARCHAR(100) DEFAULT '' COMMENT '操作: read, write等',
  `name` VARCHAR(255) NOT NULL COMMENT '权限名称',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_type` (`type`),
  KEY `idx_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ========================================
-- 4. 用户角色关联表 (rbac_user_roles)
-- ========================================
CREATE TABLE `rbac_user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `rbac_users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ========================================
-- 5. 角色权限关联表 (rbac_role_permissions)
-- ========================================
CREATE TABLE `rbac_role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `permission_id` CHAR(36) NOT NULL COMMENT '权限ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `rbac_permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ========================================
-- 6. 认证会话表 (auth_sessions)
-- ========================================
CREATE TABLE `auth_sessions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `refresh_token_hash` VARCHAR(255) NOT NULL COMMENT 'Refresh Token哈希',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `ip` VARCHAR(45) DEFAULT '' COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT '' COMMENT '用户代理',
  `revoked_at` DATETIME DEFAULT NULL COMMENT '撤销时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_refresh_token_hash` (`refresh_token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `rbac_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证会话表';

-- ========================================
-- 7. 角色数据范围表 (rbac_role_data_scopes) - 如果存在
-- ========================================
-- CREATE TABLE `rbac_role_data_scopes` (
--   `id` CHAR(36) NOT NULL PRIMARY KEY,
--   `role_id` CHAR(36) NOT NULL,
--   `scope_type` VARCHAR(50) NOT NULL COMMENT '范围类型: all/custom/department等',
--   `scope_value` TEXT DEFAULT NULL COMMENT '范围值(JSON格式)',
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   KEY `idx_role_id` (`role_id`),
--   FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色数据范围表';
```

**说明**：

- 上述 DDL 展示了表结构设计，包含字段定义、索引、外键约束
- 实际迁移时，使用 mysqldump 导出的 DDL 可能略有差异（如字段注释格式）
- 导入时以 mysqldump 导出的 `cloudbase_schema.sql` 为准
- 此 DDL 主要用于理解表结构和验证迁移结果

### 数据类型映射

由于都是 MySQL，数据类型**完全一致**：

| CloudBase 模型类型      | MySQL 实际类型              | TypeORM 类型                                          |
| ----------------------- | --------------------------- | ----------------------------------------------------- |
| `string` (id)           | `CHAR(36)` 或 `VARCHAR(36)` | `@PrimaryColumn('char', { length: 36 })`              |
| `string` (account)      | `VARCHAR(255)`              | `@Column({ type: 'varchar', length: 255 })`           |
| `string` (passwordHash) | `VARCHAR(255)`              | `@Column({ name: 'password_hash', type: 'varchar' })` |
| `number` (status)       | `TINYINT`                   | `@Column({ type: 'tinyint' })`                        |
| `number` (expiresAt)    | `BIGINT` (时间戳)           | `@Column({ type: 'bigint' })`                         |
| `DateTime` (createdAt)  | `DATETIME`                  | `@CreateDateColumn({ name: 'created_at' })`           |

---

## 📝 实施步骤

### 阶段 1: 导出 CloudBase MySQL 表结构和数据 (1 天)

#### 1.1 安装 MySQL 客户端工具

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-client

# CentOS/RHEL
sudo yum install mysql

# macOS
brew mysql-client
```

#### 1.2 导出表结构（DDL）

```bash
# 从 CloudBase MySQL 导出表结构
mysqldump -h 10.12.105.55 -P 3306 -u manage -p \
  -d \
  --skip-triggers \
  --skip-add-locks \
  cloud1-0g0w5fgq5ce8c980 > cloudbase_schema.sql

# 参数说明：
# -d: 只导出结构，不导出数据
# --skip-triggers: 跳过触发器
# --skip-add-locks: 跳过锁表语句（用于导入到本地）

# 导出后会生成 cloudbase_schema.sql 文件
# 包含所有表的 CREATE TABLE 语句
```

#### 1.3 导出数据

```bash
# 从 CloudBase MySQL 导出数据
mysqldump -h 10.12.105.55 -P 3306 -u manage -p \
  -t \
  --single-transaction \
  --quick \
  --lock-tables=false \
  cloud1-0g0w5fgq5ce8c980 > cloudbase_data.sql

# 参数说明：
# -t: 只导出数据，不导出结构
# --single-transaction: 使用事务保证一致性
# --quick: 逐行导出，适合大表
# --lock-tables=false: 不锁表

# 导出后会生成 cloudbase_data.sql 文件
# 包含所有 INSERT 语句
```

#### 1.4 导出模型配置（可选但推荐）

在 CloudBase 控制台：

1. 进入"数据模型"
2. 逐个导出模型的 JSON 配置
3. 保存为 `cloudbase-models.json`

**模型配置示例**：

```json
{
  "rbac_users": {
    "fields": [
      { "name": "_id", "type": "string", "primaryKey": true },
      { "name": "account", "type": "string", "unique": true },
      { "name": "passwordHash", "type": "string" },
      { "name": "userType", "type": "string", "defaultValue": "customer" },
      { "name": "status", "type": "number", "defaultValue": 1 }
    ],
    "relations": [{ "type": "hasMany", "model": "rbac_user_roles", "foreignKey": "userId" }]
  }
}
```

---

### 阶段 2: 在本地 MySQL 导入表结构和数据 (0.5 天)

#### 2.1 创建数据库

```bash
# 登录本地 MySQL
docker exec -it <本地mysql容器名> mysql -u root -p

# 创建数据库
mysql> CREATE DATABASE snapmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.2 导入表结构

```bash
# 方式1：使用命令行
docker exec -i <本地mysql容器名> mysql -u root -p snapmatch < cloudbase_schema.sql

# 方式2：登录 MySQL 后导入
docker exec -it <本地mysql容器名> mysql -u root -p
mysql> USE snapmatch;
mysql> source /path/to/cloudbase_schema.sql;

# 验证表已创建
mysql> SHOW TABLES;
mysql> DESCRIBE rbac_users;
```

#### 2.3 导入数据

```bash
# 方式1：使用命令行
docker exec -i <本地mysql容器名> mysql -u root -p snapmatch < cloudbase_data.sql

# 方式2：登录 MySQL 后导入
docker exec -it <本地mysql容器名> mysql -u root -p
mysql> USE snapmatch;
mysql> source /path/to/cloudbase_data.sql;

# 验证数据已导入
mysql> SELECT COUNT(*) FROM rbac_users;
mysql> SELECT COUNT(*) FROM rbac_roles;
```

---

### 阶段 3: 生成 TypeORM 实体 (1 天)

#### 方式 A: 从模型配置转换（推荐）

**手动转换示例**：

CloudBase 模型配置：

```json
{
  "fields": [
    { "name": "_id", "type": "string", "primaryKey": true },
    { "name": "account", "type": "string", "unique": true },
    { "name": "passwordHash", "type": "string" },
    { "name": "status", "type": "number", "defaultValue": 1 }
  ]
}
```

→ TypeORM 实体：

```typescript
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('rbac_users')
export class UserEntity {
  @PrimaryColumn({ name: '_id', type: 'char', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  account: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;
}
```

#### 方式 B: 使用 TypeORM 自动生成（可选）

```bash
# 安装 TypeORM 模型生成器
npm install -g typeorm-model-generator

# 从现有数据库生成实体
typeorm-model-generator -h localhost -P 3306 \
  -u snapmatch_user -p password \
  -d snapmatch \
  -e mysql \
  --no-config \
  --output ./src/entities

# 会自动生成所有实体类
```

**注意**：自动生成的实体可能需要微调：

- 添加关系定义
- 调整字段类型
- 添加装饰器选项

#### 创建完整实体列表

```typescript
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rbac_users')
export class UserEntity {
  @PrimaryColumn({ name: '_id', type: 'char', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  account: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'user_type', type: 'varchar', length: 50, default: 'customer' })
  userType: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

类似地创建其他实体：

- `role.entity.ts`
- `permission.entity.ts`
- `auth-session.entity.ts`

---

### 阶段 4: 安装依赖和配置环境 (0.5 天)

#### 4.1 安装依赖

```bash
cd feat-mywork/apps/backend
npm install @nestjs/typeorm typeorm mysql2 uuid
npm install --save-dev @types/uuid
```

#### 4.2 配置环境变量

**`.env.local` 新增配置:**

```bash
# CloudBase 配置（保留）
CLOUDBASE_ENV=cloud1-0g0w5fgq5ce8c980
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=xxx
CLOUDBASE_SECRET_KEY=xxx

# MySQL 配置（新增）
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=snapmatch_user
MYSQL_PASSWORD=SnapMatch@2024!
MYSQL_DATABASE=snapmatch

# 双写配置
ENABLE_MYSQL_DUAL_WRITE=false
MYSQL_PRIMARY=false
```

---

### 阶段 5: 实现 MySQL Repository (2-3 天)

#### 5.1 创建 MySQL Module

**`src/database/mysql.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('MYSQL_HOST') ?? 'localhost',
        port: config.get('MYSQL_PORT') ?? 3306,
        username: config.get('MYSQL_USERNAME'),
        password: config.get('MYSQL_PASSWORD'),
        database: config.get('MYSQL_DATABASE') ?? 'snapmatch',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // ⚠️ 表已存在，设为 false
        logging: config.get('NODE_ENV') === 'development',
        extra: { connectionLimit: 10 },
      }),
    }),
  ],
})
export class MySQLModule {}
```

#### 5.2 实现 MySQL Repository

**`src/users/users.repository.mysql.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { UsersRepository } from './users.repository';
import { Role } from '../auth/types';

@Injectable()
export class MySQLUsersRepository implements UsersRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByAccount(account: string) {
    const rows = await this.dataSource.query(
      `
      SELECT
        u._id AS id, u.account, u.password_hash AS passwordHash, u.status,
        GROUP_CONCAT(DISTINCT r.code) AS roles,
        GROUP_CONCAT(DISTINCT p.code) AS permissions
      FROM rbac_users u
      LEFT JOIN rbac_user_roles ur ON ur.userId = u._id
      LEFT JOIN rbac_roles r ON r._id = ur.roleId AND r.status = 1
      LEFT JOIN rbac_role_permissions rp ON rp.roleId = r._id
      LEFT JOIN rbac_permissions p ON p._id = rp.permissionId AND p.status = 1
      WHERE u.account = ? AND u.status = 1
      GROUP BY u._id
      LIMIT 1
    `,
      [account.toLowerCase()],
    );

    const row = rows[0] ?? null;
    if (!row) return null;

    return {
      id: row.id,
      account: row.account,
      passwordHash: row.passwordHash,
      status: row.status,
      roles: this.toRoles(row.roles),
      permissions: this.splitCsv(row.permissions),
    };
  }

  // ... 其他方法实现
  // 关键改动：{{param}} → ?, _id → id（AS 别名）

  private toRoles(value: string): Role[] {
    const codes = this.splitCsv(value);
    const allowed = new Set<string>(Object.values(Role));
    return codes.filter((v): v is Role => allowed.has(v));
  }

  private splitCsv(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
}
```

**关键改动点:**

- CloudBase SQL 占位符 `{{param}}` → MySQL `?`
- 主键 `_id` 在 CloudBase 可以直接访问，在 MySQL 需要加引号
- 其他 SQL 语法几乎不变

#### 5.3 更新 Users Module 配置

**修改 `src/users/users.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySQLModule } from '../database/mysql.module';
import { USERS_REPOSITORY } from './users.repository';
import { MySQLUsersRepository } from './users.repository.mysql';

@Module({
  imports: [MySQLModule],
  providers: [
    // MySQL Repository（直接使用）
    {
      provide: USERS_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): UsersRepository => new MySQLUsersRepository(config),
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
```

**说明**：

- 移除了 CloudBase 相关依赖
- 直接使用 MySQLUsersRepository
- 业务层代码无需任何修改

---

### 阶段 6: 验证和切换 (1 天)

#### 6.1 数据完整性验证

```bash
# 验证数据迁移完整性
mysql -u snapmatch_user -p snapmatch -e "
  SELECT
    (SELECT COUNT(*) FROM rbac_users) AS users,
    (SELECT COUNT(*) FROM rbac_roles) AS roles,
    (SELECT COUNT(*) FROM rbac_permissions) AS permissions,
    (SELECT COUNT(*) FROM rbac_user_roles) AS user_roles,
    (SELECT COUNT(*) FROM rbac_role_permissions) AS role_permissions,
    (SELECT COUNT(*) FROM auth_sessions) AS sessions;
"

# 抽样验证关键数据
mysql -u snapmatch_user -p snapmatch -e "
  SELECT _id, account, userType, status FROM rbac_users LIMIT 10;
  SELECT * FROM rbac_roles WHERE status = 1;
"
```

#### 6.2 切换应用连接

**1. 更新环境变量：**

```bash
# .env.local
MYSQL_HOST=your-mysql-host  # 你的 MySQL 服务器地址
MYSQL_PORT=3306
MYSQL_USERNAME=snapmatch_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=snapmatch
```

**2. 重启应用：**

```bash
npm run build
npm run start:prod
```

**3. 验证应用运行：**

```bash
# 测试用户登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"test@example.com","password":"your_password"}'

# 检查应用日志
tail -f logs/application.log
```

#### 6.3 回滚方案（如需回滚）

如果迁移后发现问题，可以快速回滚：

```bash
# 1. 恢复 CloudBase 连接配置
# .env.local
CLOUDBASE_ENV=cloud1-0g0w5fgq5ce8c980
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=xxx
CLOUDBASE_SECRET_KEY=xxx

# 2. 修改 users.module.ts，恢复 CloudBase Repository
# 将 USERS_REPOSITORY 的 provide 改回 CloudBaseUsersRepository

# 3. 重新构建和启动
npm run build
npm run start:prod
```

---

## 🧪 测试计划

### 单元测试

```typescript
// users/users.repository.mysql.spec.ts
describe('MySQLUsersRepository', () => {
  it('should return user with roles', async () => {
    const user = await repository.findByAccount('test@example.com');
    expect(user.account).toBe('test@example.com');
    expect(user.roles).toContain(Role.Customer);
  });

  it('should create user correctly', async () => {
    const user = await repository.createUser({
      account: 'newuser@example.com',
      passwordHash: 'hashed',
      userType: 'customer',
      status: 1,
      roleCodes: [Role.Customer],
    });
    expect(user.id).toBeDefined();
  });
});
```

### 集成测试

```typescript
// users/users.service.integration.spec.ts
describe('UsersService Integration', () => {
  it('should work with MySQL repository', async () => {
    // 测试完整的用户管理流程
    const user = await usersService.createUser({ ... });
    const found = await usersService.findById(user.id);
    expect(found).toBeDefined();
  });
});
```

---

## ⚠️ 风险评估与缓解

### 风险矩阵（简化后）

| 风险类型         | 风险描述                 | 影响  | 概率 | 缓解措施               |
| ---------------- | ------------------------ | ----- | ---- | ---------------------- |
| **数据丢失**     | 导出/导入过程中数据丢失  | 🟡 中 | 低   | 使用事务+备份+验证     |
| **数据不一致**   | 迁移后数据与原库不符     | 🟡 中 | 低   | 数据完整性校验         |
| **业务中断**     | MySQL 连接失败或配置错误 | 🟡 中 | 低   | 准备回滚方案           |
| **SQL 语法差异** | 查询语法不兼容           | 🟢 低 | 低   | 差异很小，主要是占位符 |
| **性能问题**     | 自建 MySQL 性能不如云库  | 🟢 低 | 低   | 配置优化和索引优化     |

### 回滚方案

**快速回滚步骤**:

```bash
# 1. 恢复 CloudBase 连接配置
# 修改 .env.local，添加 CloudBase 配置
CLOUDBASE_ENV=cloud1-0g0w5fgq5ce8c980
CLOUDBASE_REGION=ap-shanghai
CLOUDBASE_SECRET_ID=xxx
CLOUDBASE_SECRET_KEY=xxx

# 2. 恢复 CloudBase Repository
# 修改 src/users/users.module.ts
# 将 USERS_REPOSITORY 改回使用 CloudBaseUsersRepository

# 3. 重新构建和启动
npm run build
npm run start:prod

# ✅ 完成回滚
```

---

## 📅 时间表（简化后）

| 阶段                      | 时间       | 里程碑                   | 交付物                |
| ------------------------- | ---------- | ------------------------ | --------------------- |
| 阶段 1: 导出表结构和数据  | 0.5 天     | CloudBase MySQL 导出完成 | schema.sql + data.sql |
| 阶段 2: 导入本地 MySQL    | 0.5 天     | 本地 MySQL 数据就绪      | 7张表+数据            |
| 阶段 3: 生成 TypeORM 实体 | 1 天       | 实体类创建完成           | 所有 entity 文件      |
| 阶段 4: 安装依赖配置      | 0.5 天     | 开发环境就绪             | 依赖+配置             |
| 阶段 5: 实现 Repository   | 2-3 天     | MySQL Repository 完成    | repository 文件       |
| 阶段 6: 验证和切换        | 1 天       | 完成迁移，应用运行       | 生产系统              |
| **总计**                  | **5-7 天** | **完全迁移到本地 MySQL** | **生产就绪**          |

---

## 📁 关键文件清单

### 需要修改的文件

```
feat-mywork/apps/backend/
├── package.json                          # 新增 TypeORM 依赖
├── .env.example                          # 新增 MySQL 配置
├── .env.local                            # 配置 MySQL 连接
├── src/
│   ├── users/
│   │   └── users.module.ts               # 替换为 MySQL Repository
│   └── auth/sessions/
│       └── sessions.module.ts            # 替换为 MySQL Repository
```

### 需要新增的文件

```
feat-mywork/apps/backend/src/
├── database/
│   └── mysql.module.ts                   # TypeORM 模块
├── users/
│   ├── entities/                         # TypeORM 实体（7个）
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   ├── permission.entity.ts
│   │   └── ...
│   └── users.repository.mysql.ts         # MySQL 实现
├── auth/sessions/
│   ├── entities/
│   │   └── auth-session.entity.ts
│   └── auth-sessions.repository.mysql.ts
└── scripts/
    └── verify-data-integrity.ts          # 数据完整性验证
```

### 可以删除的文件（迁移完成后）

```
feat-mywork/apps/backend/src/
├── database/
│   ├── cloudbase.module.ts               # CloudBase 模块
│   └── cloudbase.constants.ts            # CloudBase 常量
├── users/
│   └── users.repository.cloudbase.ts     # CloudBase 实现
└── auth/sessions/
    └── auth-sessions.repository.cloudbase.ts
```

---

## ✅ 成功标准

### 技术指标

- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 数据完整性验证 100% 通过
- ✅ API 响应时间正常（<200ms）
- ✅ 数据库连接稳定

### 业务指标

- ✅ 无业务中断
- ✅ 无数据丢失
- ✅ 所有功能正常运行
- ✅ 用户登录和操作正常

---

## 📚 总结

此迁移方案采用**直接替换策略**，从 CloudBase MySQL 完全迁移到自建 MySQL：

### 核心优势

1. **数据库类型相同**: 都是 MySQL，表结构直接复用，无重新设计
2. **迁移复杂度低**: SQL 语法几乎无差异，主要是占位符变化
3. **数据安全**: 完整的导出导入流程和验证机制
4. **快速回滚**: 保留 CloudBase 代码，可随时回滚
5. **架构清晰**: Repository 模式使得迁移代码侵入性小
6. **周期短**: 5-7 天即可完成迁移

### 迁移策略

- **一次性切换**: 不使用双写，直接替换数据库连接
- **保留原代码**: CloudBase 相关代码保留，便于回滚
- **完整验证**: 数据完整性验证 + 功能测试
- **快速回滚**: 如有问题，可快速切回 CloudBase

### 可行性结论

✅ **完全可行，建议执行**

### 预计周期

**5-7 个工作日**（1周左右）

### 风险评估

**低风险**（有完善的回滚机制）

---

## 📞 相关文档

- [MYSQL_INSTALLATION_GUIDE.md](./MYSQL_INSTALLATION_GUIDE.md) - MySQL 安装与配置指南
- [TypeORM 官方文档](https://typeorm.io/)
- [CloudBase 数据模型文档](https://docs.cloudbase.net/)

---

**文档版本**: 3.0 (直接替换版)
**最后更新**: 2026-01-02
**主要变更**:

- ✅ 移除"主从库"和"双写"概念
- ✅ 采用直接替换策略：导出数据 → 导入自建 MySQL → 切换连接
- ✅ 简化迁移流程：从 2-3 周缩短到 5-7 个工作日
- ✅ 明确迁移意图：完全替换 CloudBase，不再保留作为备份
- ✅ 保留 CloudBase 代码便于快速回滚
- ✅ 强调表结构复用，无需重新设计
