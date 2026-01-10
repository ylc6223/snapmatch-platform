# 全局照片库 - 后端API规范

> **技术栈**: NestJS + TypeORM + MySQL
> **最后更新**: 2026-01-10

---

## 📋 API 概述

全局照片库提供RESTful API接口，支持照片的查询、筛选、搜索、批量操作等功能。

### 基础URL

```
http://localhost:3000/api/photos
```

### 通用响应格式

**成功响应**：

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": 1704873600000
  }
}
```

**分页响应**：

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "PHOTO_NOT_FOUND",
    "message": "照片不存在",
    "details": { ... }
  }
}
```

---

## 🔌 API 端点

### 1. 获取照片列表（分页+筛选）

```http
GET /api/photos
```

**查询参数**：

| 参数        | 类型   | 必填 | 说明                            | 示例                             |
| ----------- | ------ | ---- | ------------------------------- | -------------------------------- |
| `page`      | number | 否   | 页码，默认1                     | `1`                              |
| `limit`     | number | 否   | 每页数量，默认50，最大100       | `50`                             |
| `category`  | string | 否   | 类目ID                          | `cat_01ARZ3NDEKTSV4RRFFQ69G5FAV` |
| `tags`      | string | 否   | 标签ID列表，逗号分隔（AND逻辑） | `tag_123,tag_456`                |
| `sortBy`    | string | 否   | 排序字段，默认createdAt         | `createdAt`, `filename`          |
| `sortOrder` | string | 否   | 排序方向，默认DESC              | `ASC`, `DESC`                    |

**请求示例**：

```http
GET /api/photos?page=1&limit=50&category=cat_123&tags=tag_456,tag_789&sortBy=createdAt&sortOrder=DESC
```

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "pho_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "filename": "IMG_001.jpg",
      "originalKey": "photos/original/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      "thumbKey": "photos/thumb/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      "previewKey": "photos/preview/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
      "fileSize": 2048576,
      "width": 1920,
      "height": 1080,
      "categoryId": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "categoryName": "人像写真",
      "isProjectCover": false,
      "projectId": "set_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "projectName": "张三的写真拍摄",
      "customerId": "cus_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "customerName": "张三",
      "status": "ready",
      "selected": false,
      "createdAt": 1704873600000
    }
  ],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

**实现要点**：

```typescript
// photos.service.ts
async findAll(query: PhotoQueryDto): Promise<PaginatedResponse<PhotoDto>> {
  const {
    page = 1,
    limit = 50,
    category,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = query;

  const queryBuilder = this.photoRepository
    .createQueryBuilder('photo')
    .leftJoinAndSelect('photo.project', 'project')
    .leftJoinAndSelect('project.customer', 'customer')
    .leftJoinAndSelect('photo.category', 'category');

  // 类目筛选
  if (category) {
    queryBuilder.andWhere('photo.categoryId = :category', { category });
  }

  // 标签筛选（AND逻辑）
  if (tags && tags.length > 0) {
    queryBuilder.andWhere(
      `(SELECT COUNT(*) FROM photo_tags pt WHERE pt.photoId = photo.id AND pt.tagId IN (:...tags)) = :tagCount`,
      { tags, tagCount: tags.length }
    );
  }

  // 排序
  queryBuilder.orderBy(`photo.${sortBy}`, sortOrder);

  // 分页
  const [data, total] = await queryBuilder
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: data.map(photo => this.toDto(photo)),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}
```

---

### 2. 获取照片详情

```http
GET /api/photos/:id
```

**路径参数**：

| 参数 | 类型   | 必填 | 说明   |
| ---- | ------ | ---- | ------ |
| `id` | string | 是   | 照片ID |

**响应示例**：

```json
{
  "success": true,
  "data": {
    "id": "pho_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "filename": "IMG_001.jpg",
    "originalKey": "photos/original/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
    "thumbKey": "photos/thumb/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
    "previewKey": "photos/preview/pho_01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg",
    "fileSize": 2048576,
    "width": 1920,
    "height": 1080,
    "categoryId": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "category": {
      "id": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "name": "人像写真"
    },
    "tags": [
      {
        "id": "tag_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "name": "新中式",
        "group": "style"
      },
      {
        "id": "tag_02ARZ3NDEKTSV4RRFFQ69G5FAV",
        "name": "纯欲",
        "group": "emotion"
      }
    ],
    "isProjectCover": false,
    "project": {
      "id": "set_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "name": "张三的写真拍摄",
      "customer": {
        "id": "cus_01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "name": "张三"
      }
    },
    "status": "ready",
    "selected": false,
    "selectedAt": null,
    "createdAt": 1704873600000
  }
}
```

---

### 3. 更新照片元数据

```http
PATCH /api/photos/:id
```

**请求体**：

```json
{
  "categoryId": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "tagIds": ["tag_01ARZ3NDEKTSV4RRFFQ69G5FAV", "tag_02ARZ3NDEKTSV4RRFFQ69G5FAV"]
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "id": "pho_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "categoryId": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "tags": [ ... ]
  }
}
```

**实现要点**：

```typescript
async update(id: string, dto: UpdatePhotoDto) {
  await this.dataSource.transaction(async (manager) => {
    // 1. 更新类目
    await manager.update(Photo, id, {
      categoryId: dto.categoryId,
      updatedAt: Date.now()
    });

    // 2. 替换标签
    await manager.delete(PhotoTag, { photoId: id });
    if (dto.tagIds && dto.tagIds.length > 0) {
      const photoTags = dto.tagIds.map(tagId => ({
        photoId: id,
        tagId,
        createdAt: Date.now()
      }));
      await manager.insert(PhotoTag, photoTags);
    }
  });

  return this.findOne(id);
}
```

---

### 4. 删除照片

```http
DELETE /api/photos/:id
```

**响应示例**：

```json
{
  "success": true,
  "message": "照片已删除"
}
```

**实现要点**：

```typescript
async delete(id: string) {
  const photo = await this.findOne(id);

  // 1. 安全校验
  if (photo.isProjectCover) {
    throw new BadRequestException('无法删除项目封面照片');
  }

  if (photo.selected) {
    throw new BadRequestException('已选中的照片无法删除');
  }

  const projectPhotoCount = await this.photoRepository.count({
    where: { projectId: photo.projectId }
  });

  if (projectPhotoCount <= 1) {
    throw new BadRequestException('无法删除项目中唯一的照片');
  }

  // 2. 执行删除（事务）
  await this.dataSource.transaction(async (manager) => {
    // 删除照片-标签关联
    await manager.delete(PhotoTag, { photoId: id });

    // 更新项目照片数量
    await manager.decrement(Project, { id: photo.projectId }, 'photoCount', 1);

    // 删除照片记录
    await manager.delete(Photo, id);

    // TODO: 删除R2存储中的文件
  });

  return { success: true, message: '照片已删除' };
}
```

---

### 5. 批量操作

```http
POST /api/photos/batch
```

**请求体**：

```json
{
  "action": "delete" | "updateCategory" | "addTags" | "removeTags",
  "photoIds": ["pho_001", "pho_002", "pho_003"],
  "payload": {
    "categoryId": "cat_789",      // updateCategory 时必填
    "tagIds": ["tag_123"]         // addTags/removeTags 时必填
  }
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "successCount": 48,
    "failedCount": 2,
    "failedItems": [
      {
        "photoId": "pho_002",
        "error": "无法删除项目封面照片"
      }
    ]
  }
}
```

**实现要点**：

```typescript
async batchOperation(dto: BatchOperationDto) {
  const { action, photoIds, payload } = dto;

  // 分批处理（每批50张）
  const batchSize = 50;
  const results = {
    successCount: 0,
    failedCount: 0,
    failedItems: []
  };

  for (let i = 0; i < photoIds.length; i += batchSize) {
    const batch = photoIds.slice(i, i + batchSize);

    for (const photoId of batch) {
      try {
        switch (action) {
          case 'delete':
            await this.delete(photoId);
            break;

          case 'updateCategory':
            await this.update(photoId, { categoryId: payload.categoryId });
            break;

          case 'addTags':
            await this.addTags(photoId, payload.tagIds);
            break;

          case 'removeTags':
            await this.removeTags(photoId, payload.tagIds);
            break;
        }

        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.failedItems.push({
          photoId,
          error: error.message
        });
      }
    }
  }

  return results;
}
```

---

### 6. 全局搜索

```http
POST /api/photos/search
```

**请求体**：

```json
{
  "keyword": "张三",
  "fields": ["filename", "projectName", "customerName", "tagName"],
  "page": 1,
  "limit": 50
}
```

**响应示例**：

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 125,
    "page": 1,
    "limit": 50
  }
}
```

**实现要点**：

```typescript
async search(dto: SearchDto) {
  const { keyword, fields, page = 1, limit = 50 } = dto;
  const results = [];

  // 1. 搜索文件名
  if (fields.includes('filename')) {
    const byFilename = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.project', 'project')
      .leftJoinAndSelect('project.customer', 'customer')
      .where('photo.filename LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();

    results.push(...byFilename);
  }

  // 2. 搜索项目名
  if (fields.includes('projectName')) {
    const byProjectName = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoin('photo.project', 'project')
      .where('project.name LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();

    results.push(...byProjectName);
  }

  // 3. 搜索客户名
  if (fields.includes('customerName')) {
    const byCustomerName = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoin('photo.project', 'project')
      .leftJoin('project.customer', 'customer')
      .where('customer.name LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();

    results.push(...byCustomerName);
  }

  // 4. 搜索标签名
  if (fields.includes('tagName')) {
    const byTagName = await this.photoRepository
      .createQueryBuilder('photo')
      .innerJoin('photo.tags', 'tag')
      .where('tag.name LIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();

    results.push(...byTagName);
  }

  // 5. 去重（按photoId）
  const uniqueResults = this.deduplicateResults(results);

  // 6. 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedResults = uniqueResults.slice(start, end);

  return {
    data: paginatedResults.map(photo => this.toDto(photo)),
    meta: {
      total: uniqueResults.length,
      page,
      limit
    }
  };
}
```

---

### 7. 获取类目列表

```http
GET /api/categories
```

**查询参数**：

| 参数     | 类型   | 必填 | 说明             |
| -------- | ------ | ---- | ---------------- |
| `type`   | string | 否   | 类型，默认photo  |
| `status` | string | 否   | 状态，默认active |

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "name": "人像写真",
      "type": "photo",
      "parentId": null,
      "order": 1,
      "status": "active",
      "photoCount": 523
    }
  ]
}
```

---

### 8. 获取标签列表

```http
GET /api/tags
```

**查询参数**：

| 参数    | 类型   | 必填 | 说明     |
| ------- | ------ | ---- | -------- |
| `group` | string | 否   | 标签分组 |

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "tag_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "name": "新中式",
      "group": "style",
      "order": 1
    }
  ]
}
```

---

## 📝 DTO 定义

### PhotoQueryDto

```typescript
export class PhotoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  tags?: string; // 逗号分隔的标签ID

  @IsOptional()
  @IsIn(['createdAt', 'filename', 'fileSize'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

### UpdatePhotoDto

```typescript
export class UpdatePhotoDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
```

### BatchOperationDto

```typescript
export class BatchOperationDto {
  @IsIn(['delete', 'updateCategory', 'addTags', 'removeTags'])
  action: 'delete' | 'updateCategory' | 'addTags' | 'removeTags';

  @IsArray()
  @IsString({ each: true })
  photoIds: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
```

### SearchDto

```typescript
export class SearchDto {
  @IsString()
  @MinLength(1)
  keyword: string;

  @IsArray()
  @IsEnum(['filename', 'projectName', 'customerName', 'tagName'], { each: true })
  fields: ('filename' | 'projectName' | 'customerName' | 'tagName')[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 50;
}
```

---

## 🔒 权限控制

### 权限定义

```typescript
export enum PhotoPermission {
  VIEW = 'photos:view',
  EDIT = 'photos:edit',
  DELETE = 'photos:delete',
  BATCH_DELETE = 'photos:batch_delete',
}
```

### Guards

```typescript
// photos.controller.ts
@Get()
@RequirePermission(PhotoPermission.VIEW)
async findAll(@Query() query: PhotoQueryDto) {
  return this.photosService.findAll(query);
}

@Patch(':id')
@RequirePermission(PhotoPermission.EDIT)
async update(@Param('id') id: string, @Body() dto: UpdatePhotoDto) {
  return this.photosService.update(id, dto);
}

@Delete(':id')
@RequirePermission(PhotoPermission.DELETE)
async delete(@Param('id') id: string) {
  return this.photosService.delete(id);
}
```

---

## ⚡ 性能优化

### 1. 查询优化

```typescript
// 使用查询缓存
@Get()
@CacheKey('photos')
@CacheTTL(300) // 5分钟
async findAll(@Query() query: PhotoQueryDto) {
  // ...
}

// 使用select减少字段
createQueryBuilder('photo')
  .select([
    'photo.id',
    'photo.filename',
    'photo.thumbKey',
    'photo.categoryId'
  ])
```

### 2. 批量操作优化

```typescript
// 使用批量插入
async batchAddTags(photoIds: string[], tagIds: string[]) {
  const photoTags = photoIds.flatMap(photoId =>
    tagIds.map(tagId => ({
      photoId,
      tagId,
      createdAt: Date.now()
    }))
  );

  await this.photoTagRepository
    .createQueryBuilder()
    .insert()
    .into(PhotoTag)
    .values(photoTags)
    .orIgnore() // 忽略重复
    .execute();
}
```

### 3. 异步处理

```typescript
// 使用队列处理大批量操作
async batchDeleteLarge(photoIds: string[]) {
  await this.photosQueue.add('batch-delete', { photoIds });

  return {
    success: true,
    message: '批量删除任务已提交，处理完成后会通知您'
  };
}
```

---

## ✅ 测试清单

### 单元测试

```typescript
describe('PhotosService', () => {
  it('should return paginated photos', async () => {
    const result = await service.findAll({ page: 1, limit: 50 });
    expect(result.data).toHaveLength(50);
    expect(result.meta.total).toBeGreaterThan(0);
  });

  it('should filter photos by category', async () => {
    const result = await service.findAll({
      category: 'cat_123',
    });
    expect(result.data.every((p) => p.categoryId === 'cat_123')).toBe(true);
  });

  it('should filter photos by tags (AND logic)', async () => {
    const result = await service.findAll({
      tags: ['tag_123', 'tag_456'],
    });
    // 验证返回的照片同时包含这两个标签
  });

  it('should delete photo and update project photoCount', async () => {
    const initialCount = await getProjectPhotoCount('set_123');
    await service.delete('pho_123');
    const finalCount = await getProjectPhotoCount('set_123');
    expect(finalCount).toBe(initialCount - 1);
  });
});
```

### 集成测试

```typescript
describe('PhotosController (e2e)', () => {
  it('/api/photos (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/photos?page=1&limit=50')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });

  it('/api/photos/:id (PATCH)', () => {
    return request(app.getHttpServer())
      .patch('/api/photos/pho_123')
      .send({ categoryId: 'cat_456' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.categoryId).toBe('cat_456');
      });
  });
});
```

---

**维护者**: 开发团队
**最后更新**: 2026-01-10
