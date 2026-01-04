# 第三阶段：后端开发

> **学习目标**：完成后端 API 开发（apps/backend）  
> **预计时长**：8-10 小时  
> **难度等级**：⭐⭐⭐☆☆

## 本阶段内容

### 1. [项目初始化](./01-project-initialization.md)

**大纲**：

- NestJS CLI 安装与使用
- 项目结构初始化
  - 模块划分
  - 目录组织
- TypeORM 配置
  - 数据源配置
  - 实体定义
- 全局中间件配置
  - CORS
  - 验证管道
  - 异常过滤器

**实践任务**：创建基础的 NestJS 项目

---

### 2. [认证模块实现](./02-auth-module.md)

**大纲**：

- 用户表设计与实体定义
- 密码哈希（bcrypt）
- JWT 策略实现
  - accessToken 签发
  - payload 设计
- 会话管理
  - refreshToken 机制
  - 会话旋转
- 登录/登出接口
- Guard 守卫链
  - JwtAuthGuard
  - RolesGuard
  - PermissionsGuard

**实践任务**：实现完整的认证系统

---

### 3. [用户管理模块](./03-user-management.md)

**大纲**：

- 用户 CRUD 接口
  - 创建用户
  - 查询用户列表
  - 更新用户
  - 禁用用户
- Repository Pattern 实现
  - 接口抽象
  - MySQL 实现
- DTO 定义与验证
- 分页与搜索

**实践任务**：实现用户管理功能

---

### 4. [RBAC 权控实现](./04-rbac-implementation.md)

**大纲**：

- RBAC 数据模型设计
  - 用户-角色-权限关系
- 权限检查逻辑
  - 角色守卫
  - 权限守卫
- 装饰器实现
  - @Roles()
  - @Permissions()
- 数据初始化脚本
- 权限测试

**实践任务**：实现细粒度权限控制

---

### 5. [文件上传模块](./05-file-upload-module.md)

**大纲**：

- 存储抽象层设计
  - Provider Pattern
  - 接口定义
- Cloudflare R2 集成
  - AWS SDK v3 配置
  - S3 兼容 API
- 分片上传实现
  - 创建上传任务
  - 签名 Part URL
  - 完成上传
- 文件类型与大小验证
- 临时签名 URL 生成

**实践任务**：实现大文件分片上传

---

### 6. [API 设计规范](./06-api-design.md)

**大纲**：

- RESTful 设计原则
  - 路由设计
  - HTTP 方法使用
  - 状态码规范
- 统一响应格式
  - 成功响应
  - 错误响应
- API 版本控制
- 接口文档编写

**学习成果**：掌握 API 设计最佳实践

---

### 7. [测试策略](./07-testing-strategy.md)

**大纲**：

- 单元测试（Jest）
  - Service 测试
  - Repository 测试
- 集成测试
  - API 端点测试
  - 数据库测试
- 测试覆盖率
- Mock 与 Stub

**实践任务**：编写核心模块的测试用例

---

### 8. [API 文档（Swagger）](./08-documentation.md)

**大纲**：

- Swagger 配置
- API 装饰器使用
  - @ApiOperation
  - @ApiResponse
  - @ApiTags
- DTO 文档生成
- 认证配置
- 本地调试

**实践任务**：生成完整的 API 文档

---

### 9. [照片上传与选片模块（MVP）](./09-photo-selection-module.md)

**大纲**：

- 业务场景与需求分析
- 数据模型设计（最简化）
  - Photo Set 实体
  - Photo 实体
- 创建实体与数据库迁移
- Photo Set CRUD 实现
- 照片上传确认接口
- Viewer 功能实现
  - Token 访问机制
  - 照片浏览与标记
  - 选片提交
- API 测试与验证

**实践任务**：实现最小可用的照片上传与选片功能

**预计时长**：3-4 天

---

## 🎯 阶段性目标

完成本阶段后，你将拥有：

- ✅ 功能完整的后端 API
- ✅ 基于 JWT 的认证系统
- ✅ 细粒度的 RBAC 权限控制
- ✅ 大文件分片上传能力
- ✅ 完整的 API 文档
- ✅ 照片上传与选片功能（MVP）

## 📚 延伸阅读

- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [RESTful API 设计指南](https://restfulapi.net/)

## ⏭️ 下一阶段

完成本阶段后，进入[第四阶段：前端开发（管理后台）](../04-frontend-admin/README.md)

---

**返回目录**：[教程首页](../README.md)
