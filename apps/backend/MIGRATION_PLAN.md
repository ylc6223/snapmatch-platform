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

| 项目         | 当前状态                          | 目标状态   |
| ------------ | --------------------------------- | ---------- |
| **数据库**   | CloudBase MySQL (托管)            | 自建 MySQL |
| **ORM**      | 腾讯数据模型                      | TypeORM    |
| **迁移策略** | 保留 CloudBase 作为备份，双写模式 | -          |
| **数据处理** | 迁移所有现有数据                  | -          |
| **表结构**   | **复用现有结构**，不重新设计      | -          |

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
| ORM 差异（腾讯 ORM → TypeORM） | Repository 接口隔离，逐步迁移         |
| SQL 语法细微差异               | 几乎无差异，主要在占位符 `{{}}` → `?` |
| 数据一致性                     | 双写机制 + 数据校验脚本               |
| 业务中断风险                   | 渐进式迁移 + 快速回滚能力             |

---

## 🛠️ 技术选型

### ORM 框架: TypeORM

**选择理由:**

- NestJS 官方推荐，生态成熟
- TypeScript 原生支持，类型安全
- Repository 模式与现有架构完美契合
- 支持从现有数据库生成实体（简化开发）

### 双写机制: Wrapper Pattern

采用包装器模式，最小化代码改动：

```typescript
// 包装器模式，最小化代码改动
class DualWriteUsersRepository implements UsersRepository {
  constructor(
    private primary: CloudBaseUsersRepository, // 主库（CloudBase）
    private secondary?: MySQLUsersRepository, // 从库（本地 MySQL）
  ) {}

  async createUser(input) {
    // 主库同步写入
    const result = await this.primary.createUser(input);

    // 从库异步写入（失败不阻塞）
    if (this.secondary) {
      this.secondary.createUser(input).catch((err) => logger.error('Secondary write failed', err));
    }

    return result;
  }
}
```

**优势:**

- 最小化代码改动
- 渐进式迁移，风险可控
- 保持接口不变，业务层无感知

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

#### 5.3 实现双写 Repository

**`src/users/dual-write/dual-write-users.repository.ts`:**

```typescript
import { Logger } from '@nestjs/common';
import type { UsersRepository } from '../users.repository';

export class DualWriteUsersRepository implements UsersRepository {
  private readonly logger = new Logger(DualWriteUsersRepository.name);

  constructor(
    private readonly primary: UsersRepository, // CloudBase
    private readonly secondary?: UsersRepository, // MySQL
  ) {}

  async findByAccount(account: string) {
    // 查询只走主库
    return this.primary.findByAccount(account);
  }

  async createUser(input: CreateUserInput) {
    // 先写主库（同步）
    const result = await this.primary.createUser(input);

    // 异步写从库（失败不阻塞）
    if (this.secondary) {
      this.secondary.createUser(input).catch((err) => {
        this.logger.error(`[DUAL-WRITE] MySQL write failed: ${err.message}`);
      });
    }

    return result;
  }

  // ... 其他方法
}
```

#### 5.4 更新 Users Module

**修改 `src/users/users.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudbaseModule } from '../database/cloudbase.module';
import { MySQLModule } from '../database/mysql.module';
import { CLOUDBASE_APP } from '../database/cloudbase.constants';
import { USERS_REPOSITORY } from './users.repository';
import { CloudBaseUsersRepository } from './users.repository.cloudbase';
import { MySQLUsersRepository } from './users.repository.mysql';
import { DualWriteUsersRepository } from './dual-write/dual-write-users.repository';

@Module({
  imports: [CloudbaseModule, MySQLModule],
  providers: [
    // CloudBase Repository（主库）
    {
      provide: 'CLOUDBASE_USERS_REPOSITORY',
      inject: [ConfigService, CLOUDBASE_APP],
      useFactory: (config: ConfigService, app: any) =>
        new CloudBaseUsersRepository(app.models, config),
    },

    // MySQL Repository（从库）
    {
      provide: 'MYSQL_USERS_REPOSITORY',
      inject: [ConfigService],
      useFactory: () => new MySQLUsersRepository(config),
    },

    // Dual-Write Repository（对外暴露）
    {
      provide: USERS_REPOSITORY,
      inject: ['CLOUDBASE_USERS_REPOSITORY', 'MYSQL_USERS_REPOSITORY'],
      useFactory: (primary: UsersRepository, secondary?: UsersRepository): UsersRepository => {
        const enableMySQL = process.env.ENABLE_MYSQL_DUAL_WRITE === 'true';
        return new DualWriteUsersRepository(primary, enableMySQL ? secondary : undefined);
      },
    },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
```

---

### 阶段 6: 双写运行和数据验证 (1-2 周)

#### 6.1 启用双写

```bash
# .env.local
ENABLE_MYSQL_DUAL_WRITE=true

# 重启应用
npm run dev
```

#### 6.2 数据一致性验证

```bash
# 创建验证脚本
# src/scripts/verify-data-consistency.ts

class DataConsistencyVerifier {
  async verify() {
    // 对比 CloudBase MySQL 和本地 MySQL 的数据量

    const tcbCount = await tcb.models.rbac_users.count();
    const [result] = await mysql.query('SELECT COUNT(*) as count FROM rbac_users');
    const mysqlCount = result.count;

    if (tcbCount !== mysqlCount) {
      throw new Error(`Count mismatch: CloudBase=${tcbCount}, MySQL=${mysqlCount}`);
    }

    console.log(`✅ Data consistency verified (${tcbCount} records)`);
  }
}
```

```bash
npm run verify:data
```

---

### 阶段 7: 切换到本地 MySQL (1 周)

#### 7.1 灰度切换

```bash
# .env.local
MYSQL_PRIMARY=true  # 切换到 MySQL 为主库
ENABLE_MYSQL_DUAL_WRITE=true  # 继续双写到 CloudBase
```

#### 7.2 完全切换

```bash
# .env.local
ENABLE_MYSQL_DUAL_WRITE=false  # 停止双写
MYSQL_PRIMARY=true
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
  });
});
```

### 集成测试

```typescript
// users/users.service.integration.spec.ts
describe('UsersService Integration', () => {
  it('should create user and sync to both databases', async () => {
    const user = await usersService.createUser({ ... });

    // 验证 CloudBase
    const tcbUser = await tcbRepository.findByAccount('test@example.com');
    expect(tcbUser).toBeDefined();

    // 验证本地 MySQL
    const mysqlUser = await mysqlRepository.findByAccount('test@example.com');
    expect(mysqlUser).toBeDefined();
  });
});
```

---

## ⚠️ 风险评估与缓解

### 风险矩阵（简化后）

| 风险类型         | 风险描述                | 影响  | 概率 | 缓解措施               |
| ---------------- | ----------------------- | ----- | ---- | ---------------------- |
| **数据丢失**     | 导出/导入过程中数据丢失 | 🟡 中 | 低   | 使用事务+备份          |
| **数据不一致**   | 双写过程中数据分歧      | 🟡 中 | 低   | 双写监控+每日校验      |
| **性能下降**     | 双写导致响应时间增加    | 🟢 低 | 低   | 异步写入               |
| **业务中断**     | 本地 MySQL 连接失败     | 🟡 中 | 低   | 快速回滚到 CloudBase   |
| **SQL 语法差异** | 查询语法不兼容          | 🟢 低 | 低   | 差异很小，主要是占位符 |

### 回滚方案

**一键回滚**:

```bash
# 1. 关闭双写
export ENABLE_MYSQL_DUAL_WRITE=false

# 2. 重启应用
npm run dev

# ✅ 立即切换回 CloudBase
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
| 阶段 6: 双写运行          | 1-2 周     | 数据一致性验证通过       | 监控日志              |
| 阶段 7: 切换到本地        | 1 周       | 完全迁移到本地 MySQL     | 生产就绪              |
| **总计**                  | **2-3 周** | **完全迁移到本地 MySQL** | **生产系统**          |

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
│   │   ├── users.module.ts               # 添加 MySQL Repository
│   └── auth/sessions/
│       └── sessions.module.ts            # 添加 MySQL Repository
```

### 需要新增的文件

```
feat-mywork/apps/backend/src/
├── database/
│   ├── mysql.module.ts                   # TypeORM 模块
│   └── mysql.constants.ts                # MySQL 常量
├── users/
│   ├── entities/                         # TypeORM 实体（7个）
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   ├── permission.entity.ts
│   │   └── ...
│   ├── users.repository.mysql.ts         # MySQL 实现
│   └── dual-write/
│       └── dual-write-users.repository.ts # 双写包装器
├── auth/sessions/
│   ├── entities/
│   │   └── auth-session.entity.ts
│   ├── auth-sessions.repository.mysql.ts
│   └── dual-write/
│       └── dual-write-sessions.repository.ts
└── scripts/
    └── verify-data-consistency.ts        # 数据一致性校验
```

---

## ✅ 成功标准

### 技术指标

- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 数据一致性校验 100% 通过
- ✅ API p95 响应时间 <200ms（几乎无影响）
- ✅ 双写成功率 >99.9%

### 业务指标

- ✅ 无业务中断
- ✅ 无数据丢失
- ✅ 无用户感知的降级

---

## 📚 总结

此迁移方案采用**渐进式双写策略**，确保平滑过渡：

### 核心优势

1. **数据库类型相同**: 都是 MySQL，表结构直接复用，无重新设计
2. **迁移复杂度低**: SQL 语法几乎无差异，主要是占位符变化
3. **数据安全**: 多重校验机制确保数据一致性
4. **快速回滚**: 环境变量一键切换回 CloudBase
5. **架构清晰**: Repository 模式使得迁移代码侵入性小
6. **周期缩短**: 从 4-6 周缩短到 2-3 周

### 可行性结论

✅ **完全可行，强烈建议执行**

### 预计周期

**2-3 周**（比原方案缩短 50%）

### 风险评估

**低风险**（有完善的回滚机制）

---

## 📞 相关文档

- [MYSQL_INSTALLATION_GUIDE.md](./MYSQL_INSTALLATION_GUIDE.md) - MySQL 安装与配置指南
- [TypeORM 官方文档](https://typeorm.io/)
- [CloudBase 数据模型文档](https://docs.cloudbase.net/)

---

**文档版本**: 2.0 (修正版)
**最后更新**: 2026-01-02
**主要变更**:

- 修正架构描述：CloudBase MySQL（托管）+ 数据模型 ORM
- 简化迁移方案：直接导出表结构和数据
- 添加 mysqldump 导出命令
- 缩短预计周期：2-3 周
- 强调表结构复用，无需重新设计
