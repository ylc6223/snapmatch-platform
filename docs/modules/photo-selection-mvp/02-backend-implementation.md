# 后端API开发任务清单

> **状态**: 🚧 开发中
> **预计时长**: 1.5 天
> **难度**: ⭐⭐⭐⭐☆
> **依赖**: [数据库表结构](./01-database-schema.sql.md) ✅

## 📊 开发进度

- [ ] Phase 1: DTO定义 (0/3)
- [ ] Phase 2: Projects模块 (0/3)
- [ ] Phase 3: Assets模块扩展 (0/3)
- [ ] Phase 4: Viewer模块 (0/3)
- [ ] Phase 5: 注册到AppModule (0/2)

---

## Phase 1: 创建DTO定义

### 1.1 CreateProjectDto

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 10分钟

- [ ] 创建文件 `apps/backend/src/projects/dto/create-project.dto.ts`
- [ ] 定义字段和验证规则
- [ ] 添加Swagger装饰器

**文件**: `apps/backend/src/projects/dto/create-project.dto.ts`

**代码**:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: '李四婚纱照选片' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name!: string;

  @ApiProperty({ description: '项目描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '过期时间戳（毫秒）', required: false })
  @IsNumber()
  @IsOptional()
  expiresAt?: number;
}
```

---

### 1.2 UpdateProjectDto

**优先级**: 🟡 中
**依赖**: CreateProjectDto
**预计时间**: 5分钟

- [ ] 创建文件 `apps/backend/src/projects/dto/update-project.dto.ts`
- [ ] 继承CreateProjectDto，所有字段可选

**文件**: `apps/backend/src/projects/dto/update-project.dto.ts`

**代码**:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

---

### 1.3 ProjectResponseDto

**优先级**: 🔴 高
**依赖**: CreateProjectDto
**预计时间**: 10分钟

- [ ] 创建文件 `apps/backend/src/projects/dto/project-response.dto.ts`
- [ ] 定义响应结构
- [ ] 添加viewerUrl计算字段
- [ ] 实现fromEntity静态方法

**文件**: `apps/backend/src/projects/dto/project-response.dto.ts`

**代码**:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { ProjectEntity } from '../../../database/entities/project.entity';

export class ProjectResponseDto {
  @ApiProperty({ description: '项目ID' })
  id!: string;

  @ApiProperty({ description: '项目名称' })
  name!: string;

  @ApiProperty({ description: '项目描述', required: false })
  description?: string;

  @ApiProperty({ description: '访问令牌' })
  token!: string;

  @ApiProperty({ description: '访问URL（客户端使用）' })
  viewerUrl!: string;

  @ApiProperty({ description: '过期时间' })
  expiresAt?: number;

  @ApiProperty({ description: '状态' })
  status!: string;

  @ApiProperty({ description: '照片数量' })
  photoCount!: number;

  @ApiProperty({ description: '创建时间' })
  createdAt!: number;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: number;

  static fromEntity(entity: ProjectEntity, baseUrl: string): ProjectResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      token: entity.token,
      viewerUrl: `${baseUrl}/viewer/${entity.token}`,
      expiresAt: entity.expiresAt,
      status: entity.status,
      photoCount: entity.photoCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
```

---

## Phase 2: 实现Projects模块

### 2.1 ProjectsService

**优先级**: 🔴 高
**依赖**: DTO定义完成
**预计时间**: 45分钟

- [ ] 创建文件 `apps/backend/src/projects/projects.service.ts`
- [ ] 注入ProjectEntity Repository
- [ ] 实现CRUD方法
- [ ] 实现findByToken（包含过期检查）
- [ ] 实现incrementPhotoCount/decrementPhotoCount

**文件**: `apps/backend/src/projects/projects.service.ts`

**代码**:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { ProjectEntity } from '../database/entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  async create(createDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = this.projectRepository.create({
      id: `set_${nanoid(16)}`,
      token: nanoid(32),
      name: createDto.name,
      description: createDto.description,
      expiresAt: createDto.expiresAt,
      status: 'active',
      photoCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const saved = await this.projectRepository.save(project);
    return ProjectResponseDto.fromEntity(saved, process.env.BASE_URL || '');
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find({
      order: { createdAt: 'DESC' },
    });
    return projects.map((p) => ProjectResponseDto.fromEntity(p, process.env.BASE_URL || ''));
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return ProjectResponseDto.fromEntity(project, process.env.BASE_URL || '');
  }

  async update(id: string, updateDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, updateDto, { updatedAt: Date.now() });
    const saved = await this.projectRepository.save(project);
    return ProjectResponseDto.fromEntity(saved, process.env.BASE_URL || '');
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  async findByToken(token: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { token } });
    if (!project) {
      throw new NotFoundException('Invalid token');
    }

    // 检查是否过期
    if (project.expiresAt && project.expiresAt < Date.now()) {
      throw new BadRequestException('Project has expired');
    }

    // 检查是否撤销
    if (project.status === 'revoked') {
      throw new BadRequestException('Project has been revoked');
    }

    return project;
  }

  async incrementPhotoCount(projectId: string): Promise<void> {
    await this.projectRepository.increment({ id: projectId }, 'photoCount', 1);
  }

  async decrementPhotoCount(projectId: string): Promise<void> {
    await this.projectRepository.decrement({ id: projectId }, 'photoCount', 1);
  }
}
```

---

### 2.2 ProjectsController

**优先级**: 🔴 高
**依赖**: ProjectsService
**预计时间**: 20分钟

- [ ] 创建文件 `apps/backend/src/projects/projects.controller.ts`
- [ ] 定义5个路由
- [ ] 添加Swagger装饰器
- [ ] 添加权限守卫

**文件**: `apps/backend/src/projects/projects.controller.ts`

**代码**:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(@Body() createDto: CreateProjectDto) {
    return this.projectsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(@Param('id') id: string, @Body() updateDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除项目' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
```

---

### 2.3 ProjectsModule

**优先级**: 🔴 高
**依赖**: Service和Controller
**预计时间**: 5分钟

- [ ] 创建文件 `apps/backend/src/projects/projects.module.ts`
- [ ] 导入TypeOrmModule.forFeature
- [ ] 注册Controller和Service

**文件**: `apps/backend/src/projects/projects.module.ts`

**代码**:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectEntity } from '../database/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

---

## Phase 3: 扩展Assets模块

### 3.1 创建PhotoConfirmDto

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 10分钟

- [ ] 创建文件 `apps/backend/src/assets/dto/photo-confirm.dto.ts`
- [ ] 定义接口

**文件**: `apps/backend/src/assets/dto/photo-confirm.dto.ts`

**代码**:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ArrayNotEmpty, IsString as IsStringField } from 'class-validator';

export class PhotoConfirmItem {
  @ApiProperty({ description: '原始文件名' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ description: '原图R2 key' })
  @IsString()
  @IsNotEmpty()
  originalKey!: string;

  @ApiProperty({ description: '预览图R2 key' })
  @IsString()
  @IsNotEmpty()
  previewKey!: string;

  @ApiProperty({ description: '缩略图R2 key', required: false })
  @IsString()
  thumbKey?: string;

  @ApiProperty({ description: '文件大小', required: false })
  fileSize?: number;

  @ApiProperty({ description: '图片宽度', required: false })
  width?: number;

  @ApiProperty({ description: '图片高度', required: false })
  height?: number;
}

export class PhotoConfirmDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: '照片列表', type: [PhotoConfirmItem] })
  @ArrayNotEmpty()
  photos!: PhotoConfirmItem[];
}
```

---

### 3.2 扩展AssetsService

**优先级**: 🔴 高
**依赖**: ProjectsModule, Photo实体
**预计时间**: 30分钟

- [ ] 打开 `apps/backend/src/assets/assets.service.ts`
- [ ] 注入PhotoEntity Repository
- [ ] 注入ProjectsService
- [ ] 实现confirmPhotos方法

**文件**: `apps/backend/src/assets/assets.service.ts`

**新增代码**:

```typescript
async confirmPhotos(
  confirmDto: PhotoConfirmDto,
): Promise<{ confirmed: number; failed: number }> {
  // 1. 验证项目存在
  const project = await this.projectsService.findOne(confirmDto.projectId);

  // 2. 批量创建Photo记录
  const photoEntities = confirmDto.photos.map((photo) =>
    this.photoRepository.create({
      id: `photo_${nanoid(16)}`,
      projectId: confirmDto.projectId,
      filename: photo.filename,
      originalKey: photo.originalKey,
      previewKey: photo.previewKey,
      thumbKey: photo.thumbKey,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      status: 'ready',
      selected: false,
      createdAt: Date.now(),
    }),
  );

  // 3. 保存到数据库
  const saved = await this.photoRepository.save(photoEntities);

  // 4. 更新photoCount
  await this.projectsService.incrementPhotoCount(confirmDto.projectId);

  return {
    confirmed: saved.length,
    failed: 0,
  };
}
```

---

### 3.3 添加Controller路由

**优先级**: 🔴 高
**依赖**: AssetsService.confirmPhotos
**预计时间**: 10分钟

- [ ] 打开 `apps/backend/src/assets/assets.controller.ts`
- [ ] 添加 POST /photos/confirm 路由
- [ ] 添加Swagger装饰器

**文件**: `apps/backend/src/assets/assets.controller.ts`

**新增代码**:

```typescript
@Post('photos/confirm')
@ApiOperation({ summary: '确认照片上传' })
@ApiResponse({ status: 200, schema: {
  type: 'object',
  properties: {
    confirmed: { type: 'number' },
    failed: { type: 'number' },
  },
}})
async confirmPhotos(@Body() confirmDto: PhotoConfirmDto) {
  return this.assetsService.confirmPhotos(confirmDto);
}
```

---

## Phase 4: 实现Viewer模块

### 4.1 ViewerService

**优先级**: 🔴 高
**依赖**: ProjectsModule, Photo实体
**预计时间**: 45分钟

- [ ] 创建文件 `apps/backend/src/viewer/viewer.service.ts`
- [ ] 注入PhotoEntity Repository
- [ ] 注入ProjectsService
- [ ] 实现4个方法

**文件**: `apps/backend/src/viewer/viewer.service.ts`

**代码**:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../database/entities/project.entity';
import { PhotoEntity } from '../database/entities/photo.entity';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class ViewerService {
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
    private readonly projectsService: ProjectsService,
  ) {}

  async getProjectByToken(token: string): Promise<{
    project: ProjectEntity;
    photos: PhotoEntity[];
  }> {
    const project = await this.projectsService.findByToken(token);
    const photos = await this.photoRepository.find({
      where: { projectId: project.id, status: 'ready' },
      order: { createdAt: 'ASC' },
    });

    return { project, photos };
  }

  async togglePhotoSelection(token: string, photoId: string): Promise<PhotoEntity> {
    // 验证token
    await this.projectsService.findByToken(token);

    const photo = await this.photoRepository.findOne({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    photo.selected = !photo.selected;
    photo.selectedAt = photo.selected ? Date.now() : null;
    return this.photoRepository.save(photo);
  }

  async getSelectedPhotos(token: string): Promise<PhotoEntity[]> {
    // 验证token
    const { project } = await this.projectsService.findByToken(token);

    return this.photoRepository.find({
      where: { projectId: project.id, selected: true },
      order: { selectedAt: 'ASC' },
    });
  }

  async submitSelection(token: string): Promise<{
    submitted: number;
    projectId: string;
  }> {
    const { project } = await this.projectsService.findByToken(token);

    const count = await this.photoRepository.count({
      where: { projectId: project.id, selected: true },
    });

    // 更新项目状态为已提交
    await this.projectsService.update(project.id, { status: 'submitted' });

    return {
      submitted: count,
      projectId: project.id,
    };
  }
}
```

---

### 4.2 ViewerController

**优先级**: 🔴 高
**依赖**: ViewerService
**预计时间**: 15分钟

- [ ] 创建文件 `apps/backend/src/viewer/viewer.controller.ts`
- [ ] 定义4个路由
- [ ] 添加Swagger装饰器

**文件**: `apps/backend/src/viewer/viewer.controller.ts`

**代码**:

```typescript
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ViewerService } from './viewer.service';
import { PhotoEntity } from '../database/entities/photo.entity';

@ApiTags('Viewer')
@Controller('viewer')
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  @Get(':token')
  @ApiOperation({ summary: '获取选片信息' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        project: { type: 'object' },
        photos: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  getViewer(@Param('token') token: string) {
    return this.viewerService.getProjectByToken(token);
  }

  @Post(':token/photos/:id/toggle')
  @ApiOperation({ summary: '切换照片选择状态' })
  @ApiResponse({ status: 200, type: PhotoEntity })
  toggleSelection(@Param('token') token: string, @Param('id') id: string) {
    return this.viewerService.togglePhotoSelection(token, id);
  }

  @Get(':token/selection')
  @ApiOperation({ summary: '获取已选照片' })
  @ApiResponse({ status: 200, type: [PhotoEntity] })
  getSelection(@Param('token') token: string) {
    return this.viewerService.getSelectedPhotos(token);
  }

  @Post(':token/submit')
  @ApiOperation({ summary: '提交选片' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        submitted: { type: 'number' },
        projectId: { type: 'string' },
      },
    },
  })
  submitSelection(@Param('token') token: string) {
    return this.viewerService.submitSelection(token);
  }
}
```

---

### 4.3 ViewerModule

**优先级**: 🔴 高
**依赖**: Service和Controller
**预计时间**: 5分钟

- [ ] 创建文件 `apps/backend/src/viewer/viewer.module.ts`
- [ ] 导入依赖模块

**文件**: `apps/backend/src/viewer/viewer.module.ts`

**代码**:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewerController } from './viewer.controller';
import { ViewerService } from './viewer.service';
import { PhotoEntity } from '../database/entities/photo.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity]), ProjectsModule],
  controllers: [ViewerController],
  providers: [ViewerService],
})
export class ViewerModule {}
```

---

## Phase 5: 注册到AppModule

### 5.1 更新AppModule

**优先级**: 🔴 高
**依赖**: ProjectsModule, ViewerModule
**预计时间**: 5分钟

- [ ] 打开 `apps/backend/src/app.module.ts`
- [ ] 导入ProjectsModule
- [ ] 导入ViewerModule

**文件**: `apps/backend/src/app.module.ts`

**新增代码**:

```typescript
import { ProjectsModule } from './projects/projects.module';
import { ViewerModule } from './viewer/viewer.module';

@Module({
  imports: [
    // ... 现有模块
    ProjectsModule,
    ViewerModule,
  ],
})
export class AppModule {}
```

---

### 5.2 导出PhotoEntity

**优先级**: 🟡 中
**依赖**: 无
**预计时间**: 3分钟

- [ ] 在 `apps/backend/src/database/entities/photo.entity.ts` 导出
- [ ] 在需要的模块中导入

**验证**:

- [ ] AssetsService可以注入PhotoEntity Repository
- [ ] ViewerService可以注入PhotoEntity Repository

---

## 🎯 API路由汇总

```
Projects API:
POST   /api/projects              创建项目
GET    /api/projects              获取列表
GET    /api/projects/:id          获取详情
PATCH  /api/projects/:id          更新
DELETE /api/projects/:id          删除

Assets API (扩展):
POST   /api/assets/photos/confirm 确认照片上传

Viewer API:
GET    /api/viewer/:token         获取选片信息
POST   /api/viewer/:token/photos/:id/toggle  切换选择
GET    /api/viewer/:token/selection         获取已选
POST   /api/viewer/:token/submit             提交选片
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有API路由都已实现
- [ ] 所有DTO都已定义并添加验证
- [ ] Swagger文档完整可访问
- [ ] 错误处理完善（404, 400, 500）

### 代码质量

- [ ] TypeScript类型完整（无any）
- [ ] 遵循NestJS最佳实践
- [ ] ESLint通过
- [ ] 关键业务逻辑有注释

### 性能要求

- [ ] 创建项目 < 100ms
- [ ] 照片确认 < 500ms（100张）
- [ ] Viewer访问 < 200ms
- [ ] 数据库查询已优化（使用索引）

---

## 📝 相关文档

- [管理后台UI](./03-admin-ui.md) | 下一步：实现前端界面
- [数据库表结构](./01-database-schema.sql.md) | 前置依赖
- [术语规范](./00-terminology.md) | 术语定义
