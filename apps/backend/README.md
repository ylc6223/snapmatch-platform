# Backend (NestJS)

该服务为 `apps/admin`（未来也包括摄影师/客户端）提供 API：**JWT 鉴权 + RBAC 权限控制**，数据存储使用自建/云 MySQL（TypeORM），对象存储支持 Cloudflare R2（S3 兼容 API）。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [核心模块](#核心模块)
- [本地运行](#本地运行)
- [环境变量](#环境变量)
- [数据库设计](#数据库设计)
- [API 速览](#api-速览)
- [开发指南](#开发指南)
- [部署指南](#部署指南)

---

## 项目概述

SnapMatch 后端服务采用 NestJS 框架构建，提供以下核心能力：

- **身份认证与授权**：基于 JWT 的无状态认证，配合 RBAC（基于角色的访问控制）实现细粒度权限管理
- **用户管理**：管理员账号管理、角色分配、权限控制
- **资产上传**：统一的文件上传接口，支持分片上传、断点续传，适配多种云存储提供商
- **会话管理**：基于 refreshToken 的会话旋转机制，支持主动登出和会话撤销
- **API 文档**：集成 Swagger 自动生成接口文档

**设计理念**：

- **分层架构**：Controller → Service → Repository，职责清晰
- **依赖注入**：基于 NestJS IoC 容器，便于测试和扩展
- **接口抽象**：通过 Repository Pattern 解耦业务逻辑与存储实现
- **全局守卫**：统一的鉴权链路（JWT → Roles → Permissions）
- **统一响应**：标准化的 API 响应格式（成功/错误 envelope）

---

## 技术栈

### 核心框架

- **NestJS**：渐进式 Node.js 框架，提供完整的 MVC 架构支持
- **TypeScript**：类型安全，提升代码质量和可维护性

### 数据库

- **MySQL**：主数据库，存储用户、角色、权限、会话等业务数据
- **TypeORM**：ORM 框架，支持实体定义、迁移、关系映射

### 认证与授权

- **Passport**：认证中间件，提供 JWT 策略
- **JWT**：无状态 Token 认证，payload 包含用户身份和权限信息
- **bcryptjs**：密码哈希算法（10 rounds）

### 对象存储

- **AWS SDK v3**：S3 兼容 API 客户端
- **Cloudflare R2**：当前存储提供商（S3 兼容，零出口费用）
- **未来预留**：腾讯云 COS（待实现 `cos` provider）

### API 文档

- **Swagger/OpenAPI**：自动生成接口文档和测试界面

### 开发工具

- **Jest**：单元测试和集成测试框架
- **ESLint**：代码规范检查
- **Prettier**：代码格式化
- **ts-node**：直接运行 TypeScript 文件

---

## 项目架构

### 目录结构

```
apps/backend/src/
├── main.ts                 # 应用入口（Bootstrap）
├── app.module.ts           # 根模块，组装所有功能模块
│
├── auth/                   # 认证与授权模块
│   ├── auth.controller.ts       # 登录、刷新、登出接口
│   ├── auth.service.ts          # 认证核心逻辑（密码校验、JWT 签发）
│   ├── auth.module.ts           # 模块定义
│   ├── decorators/              # 装饰器（@Public, @Roles, @Permissions, @CurrentUser）
│   ├── dto/                     # 数据传输对象（请求/响应）
│   ├── guards/                  # 守卫（JWT、角色、权限）
│   ├── strategies/              # Passport 策略（JWT 解析）
│   ├── sessions/                # 会话管理（创建、旋转、撤销）
│   └── types.ts                 # 类型定义
│
├── users/                  # 用户管理模块
│   ├── users.admin.controller.ts # 用户管理接口（列表、创建、更新、禁用）
│   ├── users.service.ts          # 用户业务逻辑
│   ├── users.module.ts           # 模块定义
│   ├── users.repository.ts       # 存储接口抽象
│   ├── users.repository.mysql.ts # MySQL 实现
│   └── dto/                      # 数据传输对象
│
├── assets/                 # 资产上传模块
│   ├── assets.controller.ts      # 上传相关接口（签名、确认）
│   ├── assets.multipart.controller.ts  # 分片上传接口
│   ├── photos.controller.ts      # 照片管理接口（TODO）
│   ├── works.controller.ts       # 作品资产接口（TODO）
│   ├── assets.service.ts         # 上传业务逻辑
│   └── assets.module.ts          # 模块定义
│
├── database/               # 数据库模块
│   ├── mysql.module.ts           # TypeORM 配置
│   └── entities/                 # 实体定义
│       ├── rbac-user.entity.ts
│       ├── rbac-role.entity.ts
│       ├── rbac-permission.entity.ts
│       ├── rbac-user-role.entity.ts
│       ├── rbac-role-permission.entity.ts
│       ├── rbac-role-data-scope.entity.ts
│       └── auth-session.entity.ts
│
├── common/                 # 公共模块
│   ├── filters/            # 异常过滤器（统一错误响应）
│   ├── interceptors/       # 拦截器（响应数据封装）
│   ├── storage/            # 对象存储抽象层
│   │   ├── storage.service.ts
│   │   ├── storage.interface.ts
│   │   ├── providers/      # 存储提供商实现
│   │   │   └── r2.provider.ts
│   │   └── storage.module.ts
│   ├── swagger/            # Swagger 配置和装饰器
│   └── types/              # 公共类型定义
│
├── health/                 # 健康检查
│   └── health.controller.ts
│
└── scripts/                # 工具脚本
    ├── hash-password.ts        # 生成密码哈希
    └── seed-rbac.mysql.ts      # RBAC 数据初始化
```

---

## 核心模块

### 1. Auth 模块（认证与授权）

**职责**：负责用户身份认证、Token 管理和权限控制。

**核心组件**：

#### AuthService（认证服务）

- **登录流程**：
  1. 通过 `UsersService` 根据账号查找用户
  2. 使用 `bcryptjs` 校验密码哈希
  3. 通过 `AuthSessionsService` 创建会话，生成 `refreshToken`
  4. 签发 `accessToken`（JWT），payload 包含用户身份、角色、权限、会话 ID
- **Token 刷新**：
  - 验证 `refreshToken` 并旋转（生成新 Token，撤销旧 Token）
  - 重新签发 `accessToken`
- **登出**：
  - 支持通过 `sessionId` 或 `refreshToken` 撤销会话
  - 撤销后，绑定的 `accessToken` 立即失效（因为 JWT payload 中的 `sid` 已失效）

#### AuthSessionsService（会话管理）

- **创建会话**：生成唯一 `sessionId`、`refreshToken`（UUID），设置过期时间
- **旋转 Token**：验证旧 Token 并生成新 Token，防止会话劫持
- **撤销会话**：通过 `sessionId` 或 `refreshToken` 删除会话记录
- **存储层**：`MySqlAuthSessionsRepository`（持久化到 `auth_sessions` 表）

#### Guards（守卫链）

全局启用三个守卫，执行顺序如下：

1. **JwtAuthGuard**
   - 解析 Bearer Token
   - 验证 JWT 签名和有效期
   - 将 payload 注入到 `request.user`
   - 支持 `@Public()` 装饰器放行公共接口

2. **RolesGuard**
   - 检查 `@Roles('admin')` 装饰器
   - 验证 `request.user.roles` 是否包含所需角色
   - 特殊规则：`admin` 角色可兜底放行所有接口

3. **PermissionsGuard**
   - 检查 `@Permissions('user:create')` 装饰器
   - 验证 `request.user.permissions` 是否包含所需权限
   - 特殊规则：`*` 权限可兜底放行所有接口

#### Decorators（装饰器）

- **@Public()**：标记接口为公共访问，跳过 JWT 校验
- **@Roles('admin', 'photographer')**：限制接口访问角色
- **@Permissions('user:create', 'user:update')**：限制接口所需权限
- **@CurrentUser()**：注入当前登录用户到控制器参数

---

### 2. Users 模块（用户管理）

**职责**：管理员用户的 CRUD 操作，角色和权限关联管理。

**核心组件**：

#### UsersService（用户服务）

- **查询**：
  - `findByAccount(account)`：根据账号查找用户（登录用）
  - `findById(id)`：根据 ID 查找用户
  - `listUsers(input)`：分页查询用户列表，支持过滤和排序
  - `listRoles()`：查询所有可用角色
- **创建**：
  - 输入明文密码，自动哈希（bcrypt 10 rounds）
  - 检查账号唯一性，冲突时抛出 409 错误
- **更新**：
  - 支持更新账号、角色、密码（可选）
  - 密码为空时不更新密码字段
- **禁用**：
  - 软删除或禁用用户（通过状态字段）

#### UsersRepository（存储抽象）

- **接口定义**：`users.repository.ts` 定义存储层契约
- **MySQL 实现**：`users.repository.mysql.ts` 基于 TypeORM 实现
- **查询优化**：
  - 使用 QueryBuilder 避免*N+1*问题
  - 关联查询 `rbac_user_role` 和 `rbac_role`，一次性加载用户角色
  - 关联查询 `rbac_role_permission` 和 `rbac_permission`，一次性加载用户权限

**数据模型**：

- **rbac_user**：用户主表（id, account, passwordHash, disabled, createdAt）
- **rbac_user_role**：用户-角色关联表（userId, roleId）
- **rbac_role**：角色表（id, name, description）
- **rbac_role_permission**：角色-权限关联表（roleId, permissionId）
- **rbac_permission**：权限表（id, name, resource, action）

---

### 3. Assets 模块（资产上传）

**职责**：统一的文件上传接口，支持多种用途（作品集素材、交付照片），适配多种云存储提供商。

**核心组件**：

#### AssetsService（资产服务）

**上传流程**（S3 分片上传）：

1. **生成上传凭证** (`generateUploadToken`)
   - 验证文件类型（白名单机制）
   - 验证文件大小（根据用途和类型限制）
   - 生成对象存储键（按日期和 UUID 组织路径）
   - 调用 `StorageService` 创建分片上传（`uploadId`）
   - 返回 `uploadId`、`partSize`、`uploadStrategy: 's3-multipart'`

2. **分片上传**（前端直传）
   - 前端按 `partSize` 切分文件
   - 每个分片调用 `signUploadPart` 获取预签名 URL
   - 前端直接 PUT 到云存储（S3 Compatible API）
   - 上传完成后调用 `completeMultipartUpload` 合并分片

3. **确认上传** (`confirmPortfolioAsset` / `confirmDeliveryPhoto`)
   - 验证文件是否存在于云存储
   - 生成资产/照片 ID（UUID）
   - 保存元数据到数据库（TODO）
   - 生成访问 URL（公开 URL 或临时签名 URL）
   - 异步生成缩略图（TODO）

**文件类型限制**：

- **作品集素材**（portfolio-asset）：
  - 图片：JPEG, PNG, WebP, GIF（最大 20MB）
  - 视频：MP4, MPEG, QuickTime, AVI（最大 200MB）
- **交付照片**（delivery-photo）：
  - 图片：JPEG, PNG, WebP（最大 50MB）

**对象存储键规则**：

- 作品集素材：`portfolio/assets/{YYYY}/{MM}/{uuid}-{filename}`
- 交付照片：`delivery/photos/{projectId}/{albumId}/{uuid}-{filename}`

#### StorageModule（云存储抽象层）

**设计理念**：Provider Pattern，支持多云存储切换。

**StorageService 接口**：

```typescript
interface IStorageService {
  // 查询当前提供商类型
  getProviderType(): 'r2' | 'cos' | 'qiniu';

  // 分片上传
  createMultipartUpload(objectKey, contentType, expiresIn);
  signUploadPart(objectKey, uploadId, partNumber, expiresIn);
  listUploadedParts(objectKey, uploadId);
  completeMultipartUpload(objectKey, uploadId, parts);
  abortMultipartUpload(objectKey, uploadId);

  // 文件操作
  fileExists(objectKey);
  generatePrivateDownloadUrl(objectKey, expiresIn);
  getPublicUrl(objectKey);
}
```

**当前实现**：

- **R2Provider**（Cloudflare R2）：
  - 基于 AWS SDK v3 S3 Client
  - 支持分片上传（最小分片 5MB，默认 8MB）
  - 支持临时签名 URL（用于私有读）
  - 支持公开 URL（配置 `R2_PUBLIC_DOMAIN`）

**未来预留**：

- **COSProvider**（腾讯云 COS）：待实现

---

### 4. Database 模块（数据库层）

**职责**：TypeORM 配置和实体定义，提供数据持久化能力。

#### MysqlModule（数据库模块）

**配置**：

- 从环境变量读取连接参数（支持 `DB_*` 和 `MYSQL_*` 前缀）
- 支持 SSL 连接（云数据库必需）
- 自动加载实体（`entities: ["**/*.entity{.ts,.js}"]`）
- 开发环境启用 SQL 日志

**实体列表**：

1. **RbacUserEntity**（用户表）
2. **RbacRoleEntity**（角色表）
3. **RbacPermissionEntity**（权限表）
4. **RbacUserRoleEntity**（用户-角色关联表）
5. **RbacRolePermissionEntity**（角色-权限关联表）
6. **RbacRoleDataScopeEntity**（角色-数据范围关联表，预留）
7. **AuthSessionEntity**（会话表）

**字段类型映射**：

- `BIGINT` → JavaScript `number`（通过 `BigIntMsTransformer` 转换为毫秒时间戳）
- `DATETIME` → JavaScript `Date`
- `VARCHAR` → JavaScript `string`
- `BOOLEAN` → JavaScript `boolean`

**关系映射**：

- User ↔ UserRole ↔ Role（多对多）
- Role ↔ RolePermission ↔ Permission（多对多）
- Session → User（多对一）

---

### 5. Common 模块（公共设施）

#### ApiExceptionFilter（异常过滤器）

**功能**：捕获所有异常，统一返回错误响应格式。

**响应结构**：

```json
{
  "code": 400,
  "message": "Validation Failed",
  "errors": [{ "field": "account", "reason": "账号不能为空" }],
  "timestamp": "2024-01-03T12:00:00.000Z"
}
```

**特点**：

- 区分生产环境和开发环境（`includeDetail` 参数）
- 生产环境隐藏内部错误详情，避免泄露敏感信息
- 支持验证错误的字段级错误信息

#### ResponseEnvelopeInterceptor（响应拦截器）

**功能**：包装所有成功响应，统一返回格式。

**响应结构**：

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-03T12:00:00.000Z"
}
```

**特点**：

- 自动识别原始响应是否已包含 `code` 字段
- 仅包装未包含 `code` 的响应（避免重复包装）
- 支持流式响应（不包装）

#### Swagger 配置

**功能**：自动生成 API 文档和测试界面。

**访问地址**：`http://localhost:3002/docs`

**特点**：

- 持久化认证（保存 Bearer Token）
- 显示请求耗时
- 支持接口分组（按 Tag 分类）
- 生产环境可通过 `ENABLE_SWAGGER=false` 关闭

---

## 本地运行

```bash
# 安装依赖
pnpm --filter @snapmatch/backend install

# 开发模式（热重载）
pnpm --filter @snapmatch/backend dev

# 构建生产版本
pnpm --filter @snapmatch/backend build

# 运行生产版本
pnpm --filter @snapmatch/backend start

# 生成密码哈希
pnpm --filter @snapmatch/backend hash:password "your-password"

# 初始化 RBAC 数据
pnpm --filter @snapmatch/backend seed:rbac
```

默认端口：`3002`（可通过 `PORT` 环境变量覆盖）

访问地址：

- API: `http://localhost:3002/api/v1`
- Swagger: `http://localhost:3002/docs`
- 健康检查: `http://localhost:3002/health`

---

## 环境变量

复制并按需调整：

```bash
cp apps/backend/.env.example apps/backend/.env.local
```

### 核心配置

```bash
# 应用配置
NODE_ENV=development                    # 运行环境（development/production）
PORT=3002                               # 监听端口
API_PREFIX=api/v1                       # API 路由前缀

# CORS 配置
ADMIN_ORIGIN=http://localhost:3001      # 允许的前端 Origin

# JWT 配置
JWT_SECRET=your-super-secret-key        # JWT 签名密钥（生产环境必须修改！）
JWT_EXPIRES_IN=12h                      # accessToken 有效期（支持 12h/30m/3600s/1d/1w）

# 数据库配置
DB_HOST=localhost                       # 数据库主机
DB_PORT=3306                            # 数据库端口
DB_USERNAME=root                        # 数据库用户名
DB_PASSWORD=your-password               # 数据库密码
DB_DATABASE=snapmatch                   # 数据库名称
DB_SSL=false                            # 是否启用 SSL（云数据库通常需要）

# 对象存储配置
STORAGE_PROVIDER=r2                     # 存储提供商（r2/cos，当前仅 r2 可用）

# Cloudflare R2 配置
R2_ACCESS_KEY_ID=your-access-key        # R2 访问密钥 ID
R2_SECRET_ACCESS_KEY=your-secret-key    # R2 访问密钥
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com  # R2 API 端点
R2_BUCKET=snapmatch-assets              # R2 Bucket 名称
R2_PUBLIC_DOMAIN=https://cdn.yourdomain.com  # 公开访问域名（可选）
R2_PART_SIZE_BYTES=8388608             # 分片大小（字节，默认 8MB）

# 开发调试
AUTH_DEBUG=false                        # 是否打印认证日志（用于调试）
ENABLE_SWAGGER=true                     # 是否启用 Swagger 文档
```

---

## 数据库设计

### ER 图核心关系

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  rbac_user  │────────>│rbac_user_role│<────────│  rbac_role  │
│             │         │              │         │             │
│ - id        │         │ - userId     │         │ - id        │
│ - account   │         │ - roleId     │         │ - name      │
│ - password  │         └──────────────┘         │ - description│
└─────────────┘                                   └─────────────┘
       │                                                │
       │                                                │
       v                                                v
┌───────────────┐                              ┌─────────────────────┐
│auth_session   │                              │rbac_role_permission│
│               │                              │                     │
│ - sessionId   │                              │ - roleId            │
│ - userId      │                              │ - permissionId     │
│ - refreshToken│                              └─────────────────────┘
│ - expiresAt   │                                       │
└───────────────┘                                       │
                                                         v
                                                  ┌─────────────┐
                                                  │rbac_permission│
                                                  │             │
                                                  │ - id        │
                                                  │ - name      │
                                                  │ - resource  │
                                                  │ - action    │
                                                  └─────────────┘
```

### 关键表说明

#### rbac_user（用户表）

- `id`：用户 ID（BIGINT，雪花算法或 UUID）
- `account`：登录账号（VARCHAR，唯一）
- `passwordHash`：密码哈希（VARCHAR，bcrypt）
- `disabled`：是否禁用（BOOLEAN）
- `createdAt`：创建时间（DATETIME）

#### rbac_role（角色表）

- `id`：角色 ID（BIGINT）
- `name`：角色名称（VARCHAR，如 admin, photographer, sales）
- `description`：角色描述（VARCHAR）

#### rbac_permission（权限表）

- `id`：权限 ID（BIGINT）
- `name`：权限名称（VARCHAR，如 user:create, user:update）
- `resource`：资源标识（VARCHAR，如 user, project, photo）
- `action`：操作类型（VARCHAR，如 create, read, update, delete）

#### auth_session（会话表）

- `sessionId`：会话 ID（VARCHAR，UUID）
- `userId`：用户 ID（BIGINT，外键）
- `refreshToken`：刷新令牌（VARCHAR，UUID）
- `expiresAt`：过期时间（DATETIME）
- `ip`：客户端 IP（VARCHAR）
- `userAgent`：客户端 User-Agent（VARCHAR）

---

## API 速览

### 认证接口

- **POST** `/api/v1/auth/login`（Public）
  - 请求：`{ account, password }`
  - 响应：`{ accessToken, refreshToken, refreshExpiresAt, user }`

- **POST** `/api/v1/auth/refresh`（Public）
  - 请求：`{ refreshToken }`
  - 响应：`{ accessToken, refreshToken, refreshExpiresAt }`

- **POST** `/api/v1/auth/logout`（Public）
  - 请求：`{ refreshToken }`
  - 响应：`{ code, message, timestamp }`

- **GET** `/api/v1/auth/me`（JWT）
  - 响应：`{ user: { id, account, roles, permissions } }`

### 用户管理接口

- **GET** `/api/v1/users`（JWT + Permissions: user:list）
  - 查询参数：`page, limit, search, role`
  - 响应：`{ users, total }`

- **POST** `/api/v1/users`（JWT + Permissions: user:create）
  - 请求：`{ account, password, roleIds }`
  - 响应：`{ user }`

- **PATCH** `/api/v1/users/:id`（JWT + Permissions: user:update）
  - 请求：`{ account?, password?, roleIds? }`
  - 响应：`{ user }`

- **POST** `/api/v1/users/:id/disable`（JWT + Permissions: user:disable）
  - 响应：`{ code, message }`

### 资产上传接口

- **POST** `/api/v1/assets/sign`（JWT + Permissions）
  - 请求：`{ purpose, filename, contentType, size, projectId? }`
  - 响应：`{ token, uploadUrl, objectKey, expiresIn, uploadStrategy, uploadId, partSize }`

- **POST** `/api/v1/assets/multipart/sign-part`（JWT + Permissions）
  - 请求：`{ objectKey, uploadId, partNumber }`
  - 响应：`{ url }`

- **POST** `/api/v1/assets/multipart/list-parts`（JWT + Permissions）
  - 请求：`{ objectKey, uploadId }`
  - 响应：`{ parts }`

- **POST** `/api/v1/assets/multipart/complete`（JWT + Permissions）
  - 请求：`{ objectKey, uploadId, parts }`
  - 响应：`{ ok }`

- **POST** `/api/v1/assets/confirm/portfolio`（JWT + Permissions）
  - 请求：`{ workId, objectKey, filename, size, contentType, type, sort?, isCover? }`
  - 响应：`{ assetId, url, thumbnails }`

- **POST** `/api/v1/assets/confirm/delivery`（JWT + Permissions）
  - 请求：`{ projectId, albumId?, objectKey, filename, size, contentType, exif? }`
  - 响应：`{ photoId, status, variants }`

### 健康检查

- **GET** `/health`（Public）
  - 响应：`{ status, timestamp, uptime }`

---

## 开发指南

### 添加新模块

```bash
# 使用 NestJS CLI 生成模块
nest g module modules/new-module
nest g controller modules/new-module
nest g service modules/new-module

# 或手动创建文件
```

### 添加新接口

1. 在 `dto/` 目录定义 DTO（使用 class-validator）
2. 在 Controller 添加方法并标注 Swagger 装饰器
3. 在 Service 实现业务逻辑
4. 在 Repository 实现数据访问（如有需要）

### 添加新权限

1. 在数据库插入权限记录：

```sql
INSERT INTO rbac_permission (name, resource, action)
VALUES ('photo:delete', 'photo', 'delete');
```

2. 为角色分配权限：

```sql
INSERT INTO rbac_role_permission (roleId, permissionId)
VALUES (1, LAST_INSERT_ID());
```

3. 在接口使用装饰器：

```typescript
@Permissions('photo:delete')
@Delete('photos/:id')
deletePhoto(@Param('id') id: string) {
  // ...
}
```

### 调试技巧

**启用认证日志**：

```bash
# .env.local
AUTH_DEBUG=true
```

**查看 SQL 语句**：

```bash
# .env.local（仅开发环境）
NODE_ENV=development
```

**使用 Swagger 测试**：

1. 访问 `http://localhost:3002/docs`
2. 点击 "Authorize" 输入 `Bearer {accessToken}`
3. 调用接口测试

---

## 部署指南

### Docker 部署

#### 端口约定

- 本地开发默认监听 `3002`
- Docker 镜像内默认监听 `3000`（`Dockerfile` 设置 `PORT=3000`）
- 生产服务器端口映射：宿主机 `3002` → 容器 `3000`（例如 `-p 3002:3000`）
- ⚠️ **注意**：生产环境的 `.env.production` 中不要包含 `PORT=3002`，否则会与端口映射冲突

#### 构建镜像

```bash
cd apps/backend
docker build -t snapmatch-backend:latest .
```

#### 运行容器

```bash
docker run -d \
  --name snapmatch-backend \
  -p 3002:3000 \
  --env-file /opt/snapmatch/.env.production \
  snapmatch-backend:latest
```

### 生产环境检查清单

- [ ] 修改 `JWT_SECRET` 为强随机字符串（至少 32 位）
- [ ] 配置 `DB_SSL=true`（云数据库）
- [ ] 设置 `NODE_ENV=production`
- [ ] 配置 `R2_PUBLIC_DOMAIN`（CDN 加速）
- [ ] 初始化 RBAC 数据（`pnpm seed:rbac`）
- [ ] 关闭 Swagger（`ENABLE_SWAGGER=false`）或通过 Nginx 限制访问
- [ ] 配置 Nginx 反向代理和 HTTPS
- [ ] 设置进程管理器（PM2/Docker）
