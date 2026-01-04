# @snapmatch/shared-types

前后端共享的类型定义包。

## 📦 安装

```bash
# 在前端或后端项目中安装
pnpm add @snapmatch/shared-types
```

## 🎯 使用

### 前端 (Next.js)

```typescript
import { Project, ProjectStatus } from '@snapmatch/shared-types';

const project: Project = {
  id: 'xxx',
  name: '项目名称',
  status: ProjectStatus.SELECTING,
  // ...
};
```

### 后端 (NestJS)

```typescript
import { Project, CreateProjectDto, ProjectStatus } from '@snapmatch/shared-types';

@Injectable()
export class ProjectsService {
  async findAll(): Promise<Project[]> {
    // ...
  }
}
```

## 📝 类型定义

### Project

项目实体类型，包含所有项目字段。

### ProjectStatus

项目状态枚举：

- `PENDING` - 待选片
- `SELECTING` - 选片中
- `SUBMITTED` - 已提交
- `RETOUCHING` - 修图中
- `PENDING_CONFIRMATION` - 待确认
- `DELIVERED` - 已交付
- `CANCELLED` - 已取消

### DTOs

- `CreateProjectDto` - 创建项目
- `UpdateProjectDto` - 更新项目
- `SearchProjectDto` - 搜索项目

### API 响应

- `ApiResponse<T>` - 统一的 API 响应格式

## 🔧 开发

```bash
# 监听模式编译
pnpm dev

# 构建类型定义
pnpm build
```

## 💡 最佳实践

1. **类型变更流程**：
   - 修改此包中的类型定义
   - 前后端自动获得类型提示
   - TypeScript 会在编译时检查类型不匹配

2. **版本管理**：
   - 所有应用依赖同一个版本
   - 使用 workspace 协议：`"@snapmatch/shared-types": "workspace:*"`

3. **添加新类型**：
   - 在 `src/` 下创建新的类型文件
   - 在 `src/index.ts` 中导出
