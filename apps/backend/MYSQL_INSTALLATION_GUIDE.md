# MySQL 安装与配置指南

## 📋 文档信息

- **项目名称**: Snapmatch Backend 数据库迁移
- **目标数据库**: MySQL 8.0.35+
- **管理工具**: 1Panel
- **创建日期**: 2026-01-02
- **适用环境**: 云服务器（阿里云/腾讯云等）

---

## 📌 版本要求总结

| 版本             | 兼容性      | 性能    | 安全性    | 推荐度                |
| ---------------- | ----------- | ------- | --------- | --------------------- |
| **MySQL 8.0.36** | ✅ 完美     | ⚡ 最快 | 🔒 最安全 | ⭐⭐⭐⭐⭐ 强烈推荐   |
| **MySQL 8.0.35** | ✅ 完美     | ⚡ 最快 | 🔒 最安全 | ⭐⭐⭐⭐⭐ 推荐       |
| **MySQL 5.7.x**  | ✅ 基本支持 | 🐢 较慢 | ⚠️ 无更新 | ⭐⭐ 可用但需尽快升级 |

**最终建议**: ✅ 使用 **MySQL 8.0.36**（最新稳定版）

---

## 🚀 第一步：在 1Panel 上安装 MySQL

### 1.1 打开 1Panel 应用商店

登录 1Panel 管理面板，进入"应用商店"，搜索"MySQL"。

### 1.2 配置安装选项

#### 基础配置

| 配置项           | 推荐值                              | 说明                                           |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| **应用版本**     | `8.0.36`                            | ✅ 最新稳定版，必须选择 8.0.35+                |
| **端口**         | `3306`                              | ✅ 保持默认                                    |
| **数据存储路径** | `/opt/1panel/apps/mysql/mysql/data` | ✅ 使用默认路径，确保磁盘空间充足（至少 10GB） |
| **初始密码**     | `MyDB@2024Secure!`                  | ⚠️ **必须设置强密码**，请妥善保管              |
| **确认密码**     | `MyDB@2024Secure!`                  | ⚠️ 与初始密码完全一致                          |

#### 高级配置（如果界面提供）

| 配置项             | 推荐值                      | 说明                                 |
| ------------------ | --------------------------- | ------------------------------------ |
| **字符集**         | `utf8mb4`                   | ⚠️ **必须选择**，支持 emoji 和中文   |
| **排序规则**       | `utf8mb4_unicode_ci`        | 国际化排序规则                       |
| **时区**           | `Asia/Shanghai` 或 `+08:00` | ✅ 设置为中国时区                    |
| **最大连接数**     | `100-200`                   | 默认即可，中小应用足够               |
| **InnoDB 缓冲池**  | `1G`                        | 根据服务器内存调整（见下方说明）     |
| **启用远程访问**   | ✅ 勾选                     | 允许外部连接（如后端不在同一服务器） |
| **开机自启**       | ✅ 勾选                     | 服务器重启后自动启动                 |
| **启用慢查询日志** | 可选                        | 用于性能分析                         |

#### InnoDB 缓冲池大小参考

根据服务器内存调整 `innodb_buffer_pool_size`：

| 服务器内存 | 推荐值         | 说明         |
| ---------- | -------------- | ------------ |
| 2GB        | `512M` 或 `1G` | 最小可用配置 |
| 4GB        | `1G` 或 `2G`   | 推荐配置     |
| 8GB+       | `2G` 或 `4G`   | 高性能配置   |

### 1.3 确认并安装

检查所有配置项无误后，点击"安装"或"确认"按钮。

**预计安装时间**: 3-5 分钟

---

## 🔐 第二步：安全组与防火墙配置

### 2.1 云服务器安全组配置

如果后端应用和 MySQL 不在同一台服务器，需要开放 3306 端口：

**阿里云 ECS:**

1. 登录阿里云控制台
2. 进入"云服务器 ECS" → "实例"
3. 找到你的服务器，点击"更多" → "网络和安全组" → "安全组配置"
4. 添加入方向规则：
   ```
   协议类型: TCP
   端口范围: 3306/3306
   授权对象: 0.0.0.0/0  (不安全，仅用于测试)
             或 你的后端服务器IP/32  (推荐)
   ```

**腾讯云 CVM:**

1. 登录腾讯云控制台
2. 进入"云服务器" → "实例"
3. 找到你的服务器，点击"更多" → "安全组" → "修改规则"
4. 添加入站规则：
   ```
   类型: 自定义
   来源: 你的后端服务器IP  或 0.0.0.0/0
   协议端口: TCP:3306
   策略: 允许
   ```

### 2.2 服务器防火墙配置（可选）

如果服务器启用了 UFW 防火墙：

```bash
# 允许 MySQL 端口
sudo ufw allow 3306/tcp

# 如果只允许本地访问（更安全）
# 无需额外配置，MySQL 默认监听本地

# 查看防火墙状态
sudo ufw status
```

---

## ✅ 第三步：安装验证

### 3.1 检查 MySQL 服务状态

```bash
# 如果 1Panel 使用 Docker 部署
docker ps | grep mysql

# 期望输出示例：
# CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS
# abc123def456   mysql:8.0.36   "docker-entrypoint.s…"   5 minutes ago    Up 5 minutes
```

### 3.2 检查 MySQL 版本

```bash
# 进入 MySQL 容器（Docker 部署）
docker exec -it <容器ID或名称> mysql --version

# 期望输出：
# mysql  Ver 8.0.36 for Linux on x86_64 (MySQL Community Server - GPL)
```

### 3.3 测试登录

```bash
# 方式1：通过 1Panel 终端
# 1. 在 1Panel 中找到 MySQL 容器，点击"终端"
# 2. 输入命令：
mysql -u root -p
# 输入安装时设置的密码

# 方式2：通过服务器 SSH
docker exec -it <容器ID或名称> mysql -u root -p
# 输入安装时设置的密码
```

**成功登录后的标志**：

```
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.0.36 MySQL Community Server - GPL

mysql>
```

### 3.4 检查字符集配置

登录 MySQL 后执行：

```sql
-- 检查字符集设置
SHOW VARIABLES LIKE 'character%';

-- 期望输出关键项：
-- character_set_server = utf8mb4
-- character_set_database = utf8mb4
-- character_set_client = utf8mb4

-- 检查排序规则
SHOW VARIABLES LIKE 'collation%';

-- 期望输出：
-- collation_server = utf8mb4_unicode_ci
-- collation_database = utf8mb4_unicode_ci
```

---

## 🗄️ 第四步：创建数据库和用户

### 4.1 创建应用数据库

登录 MySQL 后执行：

```sql
-- 1. 创建数据库
CREATE DATABASE snapmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 验证数据库创建成功
SHOW DATABASES;

-- 期望输出包含：
-- | snapmatch |
```

### 4.2 创建专用用户（可选，推荐）

**使用专用用户更安全，而不是直接使用 root 账户。**

```sql
-- 1. 创建用户
CREATE USER 'snapmatch_user'@'%' IDENTIFIED BY 'YourStrongPassword123!';

-- 2. 如果后端和 MySQL 在同一服务器，可以限制为本地访问：
CREATE USER 'snapmatch_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
CREATE USER 'snapmatch_user'@'127.0.0.1' IDENTIFIED BY 'YourStrongPassword123!';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON snapmatch.* TO 'snapmatch_user'@'%';
-- 或本地访问：
GRANT ALL PRIVILEGES ON snapmatch.* TO 'snapmatch_user'@'localhost';
GRANT ALL PRIVILEGES ON snapmatch.* TO 'snapmatch_user'@'127.0.0.1';

-- 4. 刷新权限
FLUSH PRIVILEGES;

-- 5. 验证用户创建
SELECT User, Host FROM mysql.user WHERE User = 'snapmatch_user';
```

**密码要求**：

- 至少 8 位字符
- 包含大小写字母
- 包含数字
- 包含特殊字符
- 示例：`SnapMatch@2024!`

### 4.3 测试新用户连接

```bash
# 退出当前 MySQL 会话
EXIT;

# 使用新用户登录
mysql -u snapmatch_user -p snapmatch
# 输入密码

# 成功后应该看到：
# mysql>
```

---

## 🔧 第五步：执行数据库表结构

### 5.1 创建表结构

在 `snapmatch` 数据库中创建以下 6 张表：

```sql
-- 使用 snapmatch 数据库
USE snapmatch;

-- ========================================
-- 1. 用户表
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
-- 2. 角色表
-- ========================================
CREATE TABLE `rbac_roles` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `code` VARCHAR(100) NOT NULL COMMENT '角色代码: admin/photographer/sales/customer',
  `name` VARCHAR(255) NOT NULL COMMENT '角色名称',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ========================================
-- 3. 权限表
-- ========================================
CREATE TABLE `rbac_permissions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `code` VARCHAR(255) NOT NULL COMMENT '权限代码: page:dashboard, assets:read等',
  `type` VARCHAR(50) NOT NULL COMMENT '权限类型: page/action/data',
  `resource` VARCHAR(100) NOT NULL COMMENT '资源名称: dashboard, assets等',
  `action` VARCHAR(100) DEFAULT '' COMMENT '操作: read, write等',
  `name` VARCHAR(255) NOT NULL COMMENT '权限名称',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_type` (`type`),
  KEY `idx_resource` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- ========================================
-- 4. 用户角色关联表
-- ========================================
CREATE TABLE `rbac_user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `rbac_users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ========================================
-- 5. 角色权限关联表
-- ========================================
CREATE TABLE `rbac_role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `permission_id` CHAR(36) NOT NULL COMMENT '权限ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `rbac_permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ========================================
-- 6. 认证会话表
-- ========================================
CREATE TABLE `auth_sessions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID主键',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `refresh_token_hash` VARCHAR(255) NOT NULL COMMENT 'Refresh Token哈希',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `ip` VARCHAR(45) DEFAULT '' COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT '' COMMENT '用户代理',
  `revoked_at` DATETIME DEFAULT NULL COMMENT '撤销时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_refresh_token_hash` (`refresh_token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `rbac_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证会话表';
```

### 5.2 验证表创建成功

```sql
-- 查看所有表
SHOW TABLES;

-- 期望输出：
-- | auth_sessions                |
-- | rbac_permissions             |
-- | rbac_role_permissions        |
-- | rbac_roles                   |
-- | rbac_user_roles              |
-- | rbac_users                   |

-- 查看表结构
DESCRIBE rbac_users;

-- 验证外键关系
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'snapmatch'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## ⚙️ 第六步：配置后端环境变量

### 6.1 获取连接信息

根据前面的配置，准备以下信息：

| 配置项       | 值                                                                                   |
| ------------ | ------------------------------------------------------------------------------------ |
| **主机地址** | `localhost` 或 `127.0.0.1`（后端与 MySQL 同服务器）<br>或服务器内网 IP（不同服务器） |
| **端口**     | `3306`                                                                               |
| **用户名**   | `snapmatch_user`（推荐）或 `root`                                                    |
| **密码**     | 你设置的密码                                                                         |
| **数据库**   | `snapmatch`                                                                          |

### 6.2 更新 .env.local

在 `feat-mywork/apps/backend/.env.local` 文件中添加：

```bash
# ========================================
# MySQL 配置
# ========================================
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=snapmatch_user
MYSQL_PASSWORD=YourStrongPassword123!
MYSQL_DATABASE=snapmatch

# ========================================
# 双写配置
# ========================================
# 是否启用 MySQL 双写: true/false
ENABLE_MYSQL_DUAL_WRITE=false
# 是否启用 MySQL 只读模式: true/false
MYSQL_READ_ONLY=false
```

### 6.3 更新 .env.example

在 `feat-mywork/apps/backend/.env.example` 文件中添加：

```bash
# ========================================
# MySQL 配置
# ========================================
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=snapmatch_user
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=snapmatch

# ========================================
# 双写配置
# ========================================
ENABLE_MYSQL_DUAL_WRITE=false
MYSQL_READ_ONLY=false
```

**注意**: `.env.local` 包含真实密码，不要提交到 Git。`.env.example` 是模板，可以提交。

---

## 🧪 第七步：测试数据库连接

### 7.1 使用 MySQL 客户端测试

```bash
# 从后端服务器测试连接
mysql -h localhost -P 3306 -u snapmatch_user -p snapmatch

# 输入密码后，应该能成功登录

# 测试查询
SELECT COUNT(*) FROM rbac_users;
# 期望输出：0（因为还没有数据）
```

### 7.2 使用 Node.js 测试（可选）

创建临时测试脚本 `test-db-connection.js`：

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USERNAME || 'snapmatch_user',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'snapmatch',
    });

    console.log('✅ MySQL 连接成功！');

    const [rows] = await connection.execute('SELECT VERSION()');
    console.log('MySQL 版本:', rows[0]['VERSION()']);

    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库表数量:', tables.length);

    await connection.end();
    console.log('✅ 测试完成');
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
```

运行测试：

```bash
# 安装 mysql2（如果还没安装）
npm install mysql2

# 运行测试
node test-db-connection.js

# 期望输出：
# ✅ MySQL 连接成功！
# MySQL 版本: 8.0.36
# 数据库表数量: 6
# ✅ 测试完成
```

---

## 🔍 第八步：性能与安全优化

### 8.1 性能优化配置

编辑 MySQL 配置文件（1Panel 通常在容器内，可通过 1Panel 界面配置）：

```ini
[mysqld]
# 基础配置
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# InnoDB 配置
default-storage-engine=INNODB
innodb_buffer_pool_size=1G  # 根据内存调整
innodb_log_file_size=256M
innodb_flush_log_at_trx_commit=2

# 连接配置
max_connections=200
max_allowed_packet=64M
connect_timeout=10

# 查询缓存（MySQL 8.0 已移除，忽略）

# 慢查询日志（可选，用于性能分析）
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2

# 二进制日志（用于数据备份）
log_bin=mysql-bin
binlog_format=ROW
expire_logs_days=7
```

### 8.2 安全加固

```sql
-- 1. 删除匿名用户
DROP USER IF EXISTS ''@'localhost';
DROP USER IF EXISTS ''@'$(hostname)';

-- 2. 删除测试数据库
DROP DATABASE IF EXISTS test;

-- 3. 禁止 root 远程登录（推荐）
-- UPDATE mysql.user SET host='localhost' WHERE user='root';
-- FLUSH PRIVILEGES;

-- 4. 定期备份（设置定时任务）
-- mysqldump -u root -p snapmatch > backup_$(date +%Y%m%d).sql
```

---

## 🐛 故障排查

### 问题 1: 无法连接到 MySQL

**症状**: `Can't connect to MySQL server on 'localhost'`

**解决方案**:

```bash
# 1. 检查 MySQL 是否运行
docker ps | grep mysql

# 2. 检查端口是否监听
netstat -tlnp | grep 3306

# 3. 检查防火墙
sudo ufw status

# 4. 检查安全组（云服务器控制台）
```

### 问题 2: 认证失败

**症状**: `Authentication plugin 'caching_sha2_password' cannot be loaded`

**解决方案**:

```sql
-- 降级认证方式（如果 mysql2 版本过低）
ALTER USER 'snapmatch_user'@'%' IDENTIFIED WITH mysql_native_password BY 'YourStrongPassword123!';
FLUSH PRIVILEGES;
```

**或者升级 mysql2**:

```bash
npm install mysql2@latest
```

### 问题 3: 字符集问题

**症状**: 中文乱码或 emoji 显示为 `???`

**解决方案**:

```sql
-- 检查表字符集
SHOW CREATE TABLE rbac_users;

-- 确保 CHARACTER SET 是 utf8mb4
-- 如果不是，修改表：
ALTER TABLE rbac_users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题 4: 外键约束失败

**症状**: `Cannot add or update a child row`

**解决方案**:

```sql
-- 临时禁用外键检查
SET FOREIGN_KEY_CHECKS=0;

-- 执行你的操作...

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS=1;
```

---

## 📊 监控与维护

### 日常监控命令

```sql
-- 查看连接数
SHOW PROCESSLIST;

-- 查看数据库大小
SELECT
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'snapmatch'
GROUP BY table_schema;

-- 查看表行数
SELECT
    table_name AS 'Table',
    table_rows AS 'Rows'
FROM information_schema.tables
WHERE table_schema = 'snapmatch'
ORDER BY table_rows DESC;

-- 查看慢查询（如果启用了慢查询日志）
SHOW VARIABLES LIKE 'slow_query%';
```

### 定期备份脚本

创建 `/opt/backup-mysql.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_CONTAINER="mysql容器名称或ID"
MYSQL_USER="root"
MYSQL_PASSWORD="your_password"
DATABASE="snapmatch"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec $MYSQL_CONTAINER mysqldump \
  -u$MYSQL_USER -p$MYSQL_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  $DATABASE > $BACKUP_DIR/snapmatch_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/snapmatch_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: snapmatch_$DATE.sql.gz"
```

添加到 crontab:

```bash
# 每天凌晨 2 点备份
0 2 * * * /opt/backup-mysql.sh >> /var/log/mysql-backup.log 2>&1
```

---

## ✅ 安装检查清单

完成以下检查项确保 MySQL 安装配置正确：

### 安装前

- [ ] 云服务器磁盘空间充足（至少 10GB 可用）
- [ ] 云服务器内存充足（至少 2GB，推荐 4GB+）
- [ ] 已准备好强密码并妥善保存
- [ ] 已了解是否需要开放外网 3306 端口

### 安装中

- [ ] 选择了 MySQL 8.0.35+ 版本
- [ ] 字符集设置为 utf8mb4
- [ ] 排序规则设置为 utf8mb4_unicode_ci
- [ ] 时区设置为 Asia/Shanghai
- [ ] 已配置合适的 InnoDB 缓冲池大小

### 安装后

- [ ] MySQL 服务正常运行
- [ ] 版本是 8.0.35 或 8.0.36
- [ ] 可以成功登录
- [ ] 字符集是 utf8mb4
- [ ] 已创建 snapmatch 数据库
- [ ] 已创建专用用户（推荐）
- [ ] 已创建 6 张表
- [ ] 外键关系正确
- [ ] 后端环境变量已配置
- [ ] 测试连接成功

### 安全加固

- [ ] 云服务器安全组已配置（如需外网访问）
- [ ] 服务器防火墙已配置（如启用）
- [ ] 已删除匿名用户
- [ ] 已删除测试数据库
- [ ] root 用户已设置强密码
- [ ] 已设置定期备份

---

## 📚 相关文档

- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - 完整的迁移方案
- [TypeORM 官方文档](https://typeorm.io/)
- [MySQL 8.0 官方文档](https://dev.mysql.com/doc/refman/8.0/en/)

---

## 📞 支持

如遇到问题，请：

1. 检查上述故障排查章节
2. 查看 MySQL 日志：`docker logs <容器ID>`
3. 查看 1Panel 应用日志
4. 联系项目负责人或 DBA

---

**文档版本**: 1.0
**最后更新**: 2026-01-02
**维护者**: Snapmatch 开发团队
