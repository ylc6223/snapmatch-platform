# 05 文件上传模块

> **所属阶段**：[后端开发](./README.md)  
> **预计时长**：1-2 小时  
> **难度等级**：⭐⭐⭐☆☆

本节将详细介绍 Snapmatch 平台的文件上传模块，包括前后端完整实现流程。该模块采用业界最佳实践的 **"签名-直传-确认"三段式架构**，支持多种存储提供商（Cloudflare R2、腾讯云 COS），并提供断点续传、并发上传等高级特性。

---

## 📋 章节大纲

### 第一部分：概述

- [架构设计理念](#架构设计理念)
- [核心功能特性](#核心功能特性)
- [技术栈选型](#技术栈选型)
- [整体流程概览](#整体流程概览)

### 第二部分：详细说明

- [前端实现详解](#前端实现详解)
  - 文件选择与验证
  - 签名获取流程
  - 直传云存储实现
  - 确认上传完成
  - 并发控制机制
  - 状态管理设计
- [后端实现详解](#后端实现详解)
  - 签名服务实现
  - 分片上传支持
  - 确认服务实现
  - 存储抽象层设计
  - API 代理层
  - CORS 配置注意事项 ⚠️
- [存储路径规则](#存储路径规则)
- [错误处理与重试](#错误处理与重试)

### 第三部分：实践示例

- [作品集素材上传示例](#作品集素材上传示例)
- [交付照片上传示例](#交付照片上传示例)
- [断点续传实现示例](#断点续传实现示例)

### 第四部分：总结与最佳实践

- [架构优势](#架构优势)
- [性能优化建议](#性能优化建议)
- [安全性考虑](#安全性考虑)
- [扩展性设计](#扩展性设计)

---

## 🎯 学习目标

完成本节后，你将能够：

- [ ] 理解"签名-直传-确认"三段式上传架构的设计理念和优势
- [ ] 掌握前端实现文件选择、签名获取、直传云存储、确认上传的完整流程
- [ ] 理解后端签名服务、分片上传、确认服务的实现原理
- [ ] 掌握断点续传和并发上传的技术实现方案
- [ ] 了解多存储提供商（R2/COS）的抽象层设计
- [ ] 能够根据业务需求扩展和定制上传功能

---

## 💡 关键要点

- ✅ **前端直传**：文件直接上传到云存储，不占用后端服务器带宽
- ✅ **签名授权**：后端统一管理上传权限和路径规划，增强安全性
- ✅ **分片上传**：支持大文件分片上传和断点续传，提升上传体验
- ✅ **异步确认**：上传完成后异步处理缩略图、水印等耗时操作
- ✅ **存储抽象**：通过 StorageService 支持 R2/COS 多种存储提供商
- ✅ **并发控制**：Pump 调度器维持并发数限制，避免浏览器连接数超限

---

## 📚 参考资源

- **源代码**：
  - 前端组件：`apps/admin/components/features/upload/asset-upload.tsx`
  - 后端服务：`apps/backend/src/assets/assets.service.ts`
  - 后端控制器：`apps/backend/src/assets/assets.controller.ts`
  - API 代理：`apps/admin/app/api/[...path]/route.ts`
- **相关文档**：
  - [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
  - [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
  - [S3 分片上传规范](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)

---

---

## 第一部分：概述

### 架构设计理念

Snapmatch 平台的文件上传模块采用**"签名-直传-确认"三段式架构**，这是业界云存储上传的最佳实践：

![三段式上传架构](https://github.com/ylc6223/BlogAssets/raw/main/imgs/WeChate602fd77b401d03793c06d75b843e0af.webp)

**核心优势**：

1. **减轻后端压力**：文件直接上传到云存储，不占用后端服务器带宽和内存
2. **提升上传速度**：前端直传云存储，利用 CDN 加速，上传速度更快
3. **增强安全性**：后端统一管理上传权限和路径规划，避免未授权上传
4. **改善用户体验**：支持断点续传、并发上传、进度显示，上传体验更流畅
5. **降低成本**：云存储上传流量通常免费，降低后端服务器带宽成本

### 核心功能特性

#### 1. 双场景支持

- **作品集素材上传** (`portfolio-asset`)：支持图片/动图（20MB）+ 视频（200MB），用于界面展示
- **交付照片上传** (`delivery-photo`)：仅支持图片（50MB），用于客户选片/交付

#### 2. 多种上传策略

- **S3 预签名 PUT 上传** (`s3-presigned-put`)：适合小文件（< 5MB），一次性上传
- **S3 分片上传** (`s3-multipart`)：适合大文件，支持断点续传和并发上传

#### 3. 高级特性

- ✅ **断点续传**：分片上传失败后可恢复，跳过已上传的分片
- ✅ **并发上传**：可配置并发数（1-6），同时上传多个文件
- ✅ **进度显示**：实时显示上传进度百分比
- ✅ **失败重试**：上传失败后可手动重试
- ✅ **取消上传**：上传过程中可随时取消
- ✅ **自动/手动模式**：支持自动上传和手动触发上传

### 技术栈选型

#### 前端技术栈

- **React 18**：组件化开发，Hooks 状态管理
- **TypeScript**：类型安全，减少运行时错误
- **XMLHttpRequest**：原生 API，支持进度回调和取消能力
- **useReducer**：复杂状态管理，通过 Reducer 模式管理上传队列

#### 后端技术栈

- **NestJS**：企业级 Node.js 框架，模块化架构
- **JWT 认证**：接口鉴权，保护上传签名接口
- **Storage Service**：抽象存储层，支持 R2/COS 多种存储提供商
- **UUID**：生成唯一标识符，避免文件名冲突

#### 存储技术栈

- **Cloudflare R2**（推荐）：S3 兼容的对象存储，免费流出流量
- **腾讯云 COS**（备选）：国内访问速度快，支持 CDN 加速

### 整体流程概览

```
用户操作
   │
   ├─ 拖拽文件 / 点击选择
   │
   ↓
前端验证（文件类型、大小）
   │
   ↓
① 获取签名
   POST /api/assets/sign
   ← { uploadUrl, objectKey, uploadStrategy, uploadId, partSize }
   │
   ↓
② 直传云存储
   ├─ 策略 A: 预签名 PUT（小文件）
   │   PUT {uploadUrl}
   │
   └─ 策略 B: 分片上传（大文件）
       ├─ 列出已上传分片（断点续传）
       ├─ 逐个上传分片
       └─ 合并所有分片
   │
   ↓
③ 确认上传
   ├─ 交付照片: POST /api/photos/confirm
   └─ 作品集素材: POST /api/works/:workId/assets/confirm
   ← { photoId/assetId, url, variants/thumbnails }
   │
   ↓
完成（数据库保存元数据、异步处理缩略图/水印）
```

---

## 第二部分：详细说明

### 前端实现详解

#### 1. 文件选择与验证

**文件来源**：`apps/admin/components/features/upload/asset-upload.tsx`

```typescript
// 文件验证函数
function validateFile(purpose: UploadPurpose, file: File) {
  // 根据上传目的定义允许的文件类型
  const allowed =
    purpose === 'portfolio-asset'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] // 支持动图
      : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']; // 交付照片不支持动图

  if (!allowed.includes(file.type)) {
    return `不支持的文件类型：${file.type || 'unknown'}`;
  }

  // 根据上传目的定义文件大小限制
  const maxSize = purpose === 'portfolio-asset' ? 20 * 1024 * 1024 : 50 * 1024 * 1024; // 20MB vs 50MB

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / 1024 / 1024);
    const currentMb = (file.size / 1024 / 1024).toFixed(2);
    return `文件过大：${currentMb}MB，最大允许 ${maxMb}MB`;
  }

  return null; // 验证通过
}
```

**验证规则**：

| 上传目的   | 允许的文件类型       | 大小限制              |
| ---------- | -------------------- | --------------------- |
| 作品集素材 | 图片（含动图）+ 视频 | 图片 20MB，视频 200MB |
| 交付照片   | 仅图片（不含动图）   | 50MB                  |

#### 2. 签名获取流程

**API 调用**：`apps/admin/components/features/upload/asset-upload.tsx:397-424`

```typescript
async function signAsset(input: {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  size: number;
  projectId?: string; // 交付照片需要
  workId?: string; // 作品集素材需要
}) {
  const payload = await apiFetch<ApiResponse<SignAssetData>>(
    withAdminBasePath('/api/assets/sign'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  const data = payload.data;
  if (!data?.objectKey) throw new Error('Invalid sign response: missing objectKey');

  // 验证响应数据的完整性
  const strategy: UploadStrategy = data.uploadStrategy ?? 's3-multipart';
  if (strategy === 's3-multipart') {
    if (!data.uploadId || !data.partSize) {
      throw new Error('Invalid sign response: missing uploadId/partSize for multipart upload');
    }
  } else if (strategy === 's3-presigned-put') {
    if (!data.uploadUrl) {
      throw new Error('Invalid sign response: missing uploadUrl for presigned put');
    }
  }

  return data;
}
```

**请求参数**：

- `purpose`：上传目的（`portfolio-asset` 或 `delivery-photo`）
- `filename`：原始文件名
- `contentType`：文件 MIME 类型
- `size`：文件大小（字节）
- `projectId`：项目 ID（交付照片必填）
- `workId`：作品 ID（作品集素材必填）

**响应数据**：

```typescript
type SignAssetData = {
  token: string; // 上传令牌（预留）
  uploadUrl: string; // 预签名上传 URL（presigned-put 策略）
  objectKey: string; // 对象存储键名
  expiresIn: number; // 过期时间（秒）
  uploadStrategy?: UploadStrategy; // 上传策略
  uploadId?: string; // 分片上传 ID（multipart 策略）
  partSize?: number; // 分片大小（字节，multipart 策略）
};
```

#### 3. 直传云存储实现

##### 策略 A：S3 预签名 PUT 上传（小文件）

**适用场景**：文件 < 5MB，使用 `s3-presigned-put` 策略

**实现代码**：`apps/admin/components/features/upload/asset-upload.tsx:426-466`

```typescript
function uploadPartWithXhr(input: {
  url: string; // 预签名 URL
  body: Blob; // 文件内容
  onProgress: (loaded: number) => void; // 进度回调
  signal?: AbortSignal; // 用于取消上传
}) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ etag: string }>((resolve, reject) => {
    xhr.open('PUT', input.url, true);

    // 监听上传进度
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      input.onProgress(event.loaded); // 回调已上传字节数
    };

    // 上传完成
    xhr.onload = () => {
      const status = xhr.status;
      if (status < 200 || status >= 300) {
        reject(new Error(`Upload failed: ${status}`));
        return;
      }

      // 从响应头中获取 ETag
      const raw = (xhr.getResponseHeader('etag') ?? xhr.getResponseHeader('ETag') ?? '').trim();
      const etag = raw.startsWith('"') && raw.endsWith('"') ? raw : raw ? `"${raw}"` : '';

      if (!etag) {
        reject(new Error('Upload failed: missing ETag response header'));
        return;
      }

      resolve({ etag });
    };

    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.onabort = () => reject(new Error('Upload canceled'));

    xhr.send(input.body); // 发送文件内容
  });

  // 支持通过 AbortSignal 取消上传
  const abort = () => xhr.abort();
  if (input.signal) {
    if (input.signal.aborted) abort();
    input.signal.addEventListener('abort', abort, { once: true });
  }

  return { xhr, promise };
}
```

##### 策略 B：S3 分片上传（大文件）

**适用场景**：文件 ≥ 5MB，使用 `s3-multipart` 策略

**实现代码**：`apps/admin/components/features/upload/asset-upload.tsx:468-539`

```typescript
async function uploadToS3Multipart(input: {
  objectKey: string;
  uploadId: string;
  partSize: number; // 每个分片的大小（字节）
  file: File;
  onProgress: (percent: number) => void; // 总体进度百分比
  signal?: AbortSignal;
  onXhr?: (xhr: XMLHttpRequest) => void; // 用于保存 XHR 引用以便取消
}) {
  const totalParts = Math.ceil(input.file.size / input.partSize);

  // ① 获取已上传的分片（断点续传）
  const already = await listUploadedParts({
    objectKey: input.objectKey,
    uploadId: input.uploadId,
  });

  const completed = new Map<number, string>();
  for (const p of already) {
    if (p.partNumber > 0 && p.etag) completed.set(p.partNumber, p.etag);
  }

  // ② 计算已完成的字节数，用于进度计算
  const completedBytes = Array.from(completed.keys()).reduce(
    (sum, partNumber) => sum + partBytes(partNumber),
    0,
  );

  let uploadedBytes = completedBytes;

  // ③ 收集所有分片信息
  const allParts: { partNumber: number; etag: string }[] = Array.from(completed.entries()).map(
    ([partNumber, etag]) => ({ partNumber, etag }),
  );

  // ④ 逐个上传分片
  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    if (input.signal?.aborted) throw new Error('Upload canceled');
    if (completed.has(partNumber)) continue; // 跳过已上传的分片（断点续传）

    // 获取分片上传的预签名 URL
    const url = await signUploadPart({
      objectKey: input.objectKey,
      uploadId: input.uploadId,
      partNumber,
    });

    // 切片文件
    const start = (partNumber - 1) * input.partSize;
    const end = Math.min(input.file.size, partNumber * input.partSize);
    const blob = input.file.slice(start, end);

    // 上传分片
    const { xhr, promise } = uploadPartWithXhr({
      url,
      body: blob,
      signal: input.signal,
      onProgress(loaded) {
        // 计算总体进度（包括已完成的分片）
        const percent = Math.round(((uploadedBytes + loaded) / input.file.size) * 100);
        input.onProgress(percent);
      },
    });

    input.onXhr?.(xhr);
    const result = await promise;

    uploadedBytes += blob.size;
    completed.set(partNumber, result.etag);
    allParts.push({ partNumber, etag: result.etag });
  }

  // ⑤ 完成分片上传，合并所有分片
  await completeMultipartUpload({
    objectKey: input.objectKey,
    uploadId: input.uploadId,
    parts: allParts,
  });
}
```

#### 4. 确认上传完成

**交付照片确认**：`apps/admin/components/features/upload/asset-upload.tsx:597-618`

```typescript
async function confirmAsset(input: {
  purpose: UploadPurpose;
  objectKey: string;
  file: File;
  projectId?: string;
  workId?: string;
}) {
  // 交付照片确认
  if (input.purpose === 'delivery-photo') {
    if (!input.projectId) throw new Error('delivery-photo 需要 projectId');
    return apiFetch<ApiResponse<unknown>>(withAdminBasePath('/api/photos/confirm'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId: input.projectId,
        objectKey: input.objectKey,
        filename: input.file.name,
        size: input.file.size,
        contentType: input.file.type,
      }),
    });
  }

  // 作品集素材确认
  if (!input.workId) throw new Error('portfolio-asset 需要 workId');
  const kind = fileKind(input.file.type);
  if (kind !== 'image' && kind !== 'video')
    throw new Error('无法识别文件类型（仅支持 image/video）');

  return apiFetch<ApiResponse<unknown>>(
    withAdminBasePath(`/api/works/${input.workId}/assets/confirm`),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        objectKey: input.objectKey,
        filename: input.file.name,
        size: input.file.size,
        contentType: input.file.type,
        type: kind,
      }),
    },
  );
}
```

#### 5. 并发控制机制

**Pump 调度器**：`apps/admin/components/features/upload/asset-upload.tsx:661-739`

```typescript
/**
 * Pump: 上传调度器
 * 负责从队列中取出待上传文件，维持并发数限制，执行完整上传流程
 */
const pump = React.useCallback(async () => {
  // 循环处理，直到达到并发限制或队列为空
  while (activeCountRef.current < effectiveConcurrency) {
    // 查找下一个待上传的文件
    const next = itemsRef.current.find(
      (item) => item.status === "queued" && !inFlightIdsRef.current.has(item.id)
    );

    if (!next) {
      // 检查是否所有文件都已完成
      if (
        activeCountRef.current === 0 &&
        itemsRef.current.some((i) => i.status === "success") &&
        itemsRef.current.every(
          (i) => !["queued", "signing", "uploading", "confirming"].includes(i.status)
        )
      ) {
        onAllCompleteRef.current?.(itemsRef.current);
      }
      return;
    }

    // 增加活跃计数并标记为处理中
    activeCountRef.current += 1;
    inFlightIdsRef.current.add(next.id);
    dispatch({ type: "update", id: next.id, patch: { status: "signing", errorMessage: null } });

    // 创建取消控制器
    const controller = new AbortController();
    controllersRef.current.set(next.id, controller);

    // 执行上传流程（立即执行，不等待）
    (async () => {
      try {
        // 1. 获取上传签名
        const signed = await signAsset({...});

        // 2. 根据策略上传文件
        if (strategy === "s3-multipart") {
          await uploadToS3Multipart({...});
        } else if (strategy === "s3-presigned-put") {
          await uploadPartWithXhr({...});
        }

        // 3. 确认上传完成
        const confirmed = await confirmAsset({...});

        // 4. 标记为成功
        dispatch({ type: "update", id: next.id, patch: { status: "success" } });
      } catch (error) {
        // 错误处理
      } finally {
        // 清理资源并触发下一轮调度
        activeCountRef.current -= 1;
        inFlightIdsRef.current.delete(next.id);
        schedulePumpRef.current();  // 递归调用
      }
    })();
  }
}, [effectiveConcurrency]);
```

#### 6. 状态管理设计

**状态类型**：`apps/admin/components/features/upload/asset-upload.tsx:64-71`

```typescript
type UploadStatus =
  | 'queued' // 排队中
  | 'signing' // 获取签名中
  | 'uploading' // 上传中
  | 'confirming' // 确认中
  | 'success' // 成功
  | 'error' // 失败
  | 'canceled'; // 已取消

type UploadItem = {
  id: string; // 唯一标识
  file: File; // 文件对象
  status: UploadStatus; // 当前状态
  progress: number; // 上传进度（0-100）
  objectKey: string | null; // 对象存储键名
  errorMessage: string | null; // 错误信息
  confirm: ConfirmResult | null; // 确认结果
};
```

**状态转换**：

```
queued → signing → uploading → confirming → success
                           ↓
                         error (可重试 → queued)
                           ↓
                         canceled (不可恢复)
```

---

### 后端实现详解

#### 1. 签名服务实现

**文件位置**：`apps/backend/src/assets/assets.service.ts:47-97`

```typescript
async generateUploadToken(
  purpose: UploadPurpose,
  filename: string,
  contentType: string,
  size: number,
  projectId?: string,
): Promise<UploadTokenResult> {
  // 1. 验证文件类型
  this.validateContentType(purpose, contentType);

  // 2. 验证文件大小
  this.validateFileSize(purpose, contentType, size);

  // 3. 生成对象存储键
  const objectKey = this.generateObjectKey(purpose, filename, projectId);

  // 4. 生成上传凭证（有效期 1 小时）
  const expiresIn = 3600;
  const providerType = this.storageService.getProviderType();

  if (providerType === 'r2') {
    // Cloudflare R2：分片上传
    const init = await this.storageService.createMultipartUpload(
      objectKey,
      contentType,
      expiresIn,
    );
    return {
      token: '',
      uploadUrl: '',
      objectKey: init.objectKey,
      expiresIn: init.expiresIn ?? expiresIn,
      uploadStrategy: 's3-multipart',
      uploadId: init.uploadId,
      partSize: init.partSize,
    };
  }

  // 腾讯云 COS：预签名 PUT
  const tokenResult = await this.storageService.generateUploadToken(objectKey, expiresIn);
  return { ...tokenResult, uploadStrategy: 's3-presigned-put' };
}
```

**文件类型和大小限制**：

```typescript
const FILE_SIZE_LIMITS = {
  'portfolio-asset': {
    image: 20 * 1024 * 1024, // 20MB
    video: 200 * 1024 * 1024, // 200MB
  },
  'delivery-photo': {
    image: 50 * 1024 * 1024, // 50MB
  },
} as const;

const ALLOWED_CONTENT_TYPES = {
  'portfolio-asset': [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
  ],
  'delivery-photo': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;
```

#### 2. 分片上传支持

**初始化分片上传**：

```typescript
if (providerType === 'r2') {
  const init = await this.storageService.createMultipartUpload(objectKey, contentType, expiresIn);
  return {
    uploadStrategy: 's3-multipart',
    uploadId: init.uploadId,
    partSize: init.partSize,
  };
}
```

**签名分片、列出已上传分片、完成分片上传**：参考代码示例

#### 3. 确认服务实现

**交付照片确认**：`apps/backend/src/assets/assets.service.ts:179-226`

**作品集素材确认**：`apps/backend/src/assets/assets.service.ts:228-265`

确认服务主要完成：

1. 验证文件是否存在于云存储
2. 生成照片/资产 ID
3. TODO: 保存元数据到数据库
4. 生成访问 URL
5. TODO: 异步处理缩略图/水印

#### 4. 存储抽象层设计

**StorageService 接口**：`apps/backend/src/common/storage/storage.service.ts`

提供统一接口支持 R2/COS 多种存储提供商，业务代码不关心底层存储实现。

#### 5. API 代理层

**文件位置**：`apps/admin/app/api/[...path]/route.ts`

关键功能：

- 自动添加 Bearer Token
- 401 自动刷新并重试
- Token 更新和错误处理

#### 6. CORS 配置注意事项

**⚠️ 重要：Cloudflare R2 需要单独配置 CORS 规则**

由于采用"前端直传"架构，浏览器会直接向 R2 存储桶发送请求。如果 R2 存储桶未配置 CORS 规则，浏览器会阻止上传请求。

##### 问题表现

当 CORS 配置缺失时，浏览器控制台会出现类似错误：

```
Access to XMLHttpRequest at 'https://<bucket-id>.r2.cloudflarestorage.com/...'
from origin 'http://localhost:3001' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

##### CORS 工作原理

```
浏览器（localhost:3001）
    ↓ 发起 OPTIONS 预检请求
R2 存储桶
    ↓ 检查 CORS 配置
    ↓ 返回响应头：
    - Access-Control-Allow-Origin: http://localhost:3001
    - Access-Control-Allow-Methods: PUT, GET, POST, DELETE
    - Access-Control-Allow-Headers: *
    ↓ 浏览器检查响应头
✅ 通过 → 允许上传
❌ 失败 → 阻止请求
```

**关键点**：

- CORS 是**浏览器的安全机制**，与地理位置无关
- 只要浏览器能访问到 R2，CORS 配置就会生效
- 本地开发（`localhost:3001`）和生产环境都需要配置

##### R2 CORS 配置方法

**方案 1：通过 Cloudflare Dashboard 配置（推荐）**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2 Objects** → 选择你的存储桶
3. 点击 **Settings** → **CORS Policy**
4. 添加 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**方案 2：通过 Wrangler CLI 配置**

创建 `cors.json` 文件：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

然后应用配置：

```bash
wrangler r2 bucket put your-bucket-name --cors-config cors.json
```

##### CORS 配置参数说明

| 参数             | 说明                 | 推荐值                                                                   |
| ---------------- | -------------------- | ------------------------------------------------------------------------ |
| `AllowedOrigins` | 允许的跨域来源       | 开发环境：`http://localhost:3001`<br>生产环境：`https://your-domain.com` |
| `AllowedMethods` | 允许的 HTTP 方法     | 至少需要 `PUT`（上传）和 `GET`（下载）                                   |
| `AllowedHeaders` | 允许的请求头         | `*` 表示允许所有头（包括 `Content-Type`、`X-Amz-*` 等）                  |
| `ExposeHeaders`  | 暴露给浏览器的响应头 | 至少需要 `ETag`（分片上传必需）                                          |
| `MaxAgeSeconds`  | 预检请求缓存时间     | `3600`（1小时）减少预检请求频率                                          |

##### 配置示例

**开发环境配置**：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001"],
    "AllowedMethods": ["PUT", "GET", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**生产环境配置**：

```json
[
  {
    "AllowedOrigins": ["https://snapmatch-admin.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["Content-Type", "Content-MD5", "X-Amz-Date", "X-Amz-Security-Token"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**多环境配置**（开发 + 生产）：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://snapmatch-admin.com"],
    "AllowedMethods": ["PUT", "GET", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

##### 验证 CORS 配置

**1. 检查预检请求**：

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v "https://<your-bucket-id>.r2.cloudflarestorage.com/"
```

**2. 预期响应头**：

```
< Access-Control-Allow-Origin: http://localhost:3001
< Access-Control-Allow-Methods: PUT, GET, POST, DELETE, HEAD
< Access-Control-Allow-Headers: *
< Access-Control-Expose-Headers: ETag
< Access-Control-Max-Age: 3600
```

**3. 测试上传**：

配置完成后，刷新浏览器页面（清除缓存），再次尝试上传，应该不会再出现 CORS 错误。

##### 常见问题

**Q1：为什么后端有 CORS 配置还不够？**

A：因为前端是**直接上传到 R2**（使用预签名 URL），绕过了后端。所以需要 R2 存储桶本身允许跨域请求。

**Q2：可以通过后端代理上传吗？**

A：可以，但会失去预签名 URL 的优势（大文件占用后端带宽）。当前架构的设计是前端直传 R2，这是最佳实践。

**Q3：本地开发配置 `localhost:3001` 有用吗？本地和存储桶不在一个地方。**

A：**完全有用**！CORS 是浏览器层面的安全机制，与地理位置无关。只要浏览器能访问到 R2，CORS 配置就会生效。

**Q4：CORS 配置生效需要多久？**

A：通常立即生效，但可能需要等待 1-2 分钟。如果没生效，清除浏览器缓存再试。

**Q5：生产环境需要配置 CORS 吗？**

A：需要。生产环境的前端域名（如 `https://snapmatch-admin.com`）必须添加到 `AllowedOrigins` 中。

**Q6：可以使用通配符 `*` 吗？**

A：不建议。`AllowedOrigins: ["*"]` 会允许任何网站跨域访问你的存储桶，存在安全风险。应该明确指定允许的域名。

##### 安全建议

1. **使用明确的域名**：避免使用 `*` 通配符
2. **限制 HTTP 方法**：只允许必要的 `PUT` 和 `GET`
3. **限制请求头**：生产环境可以明确指定允许的请求头
4. **定期审查**：定期检查和更新 CORS 配置，移除不再需要的域名

---

### 存储路径规则

**路径生成函数**：`apps/backend/src/assets/assets.service.ts:157-178`

```typescript
/**
 * 生成对象存储键
 *
 * 路径规则：
 * - Portfolio Asset: portfolio/assets/{YYYY}/{MM}/{uuid}-{filename}
 * - Delivery Photo: delivery/photos/{projectId}/{albumId}/{uuid}-{filename}
 */
private generateObjectKey(purpose: UploadPurpose, filename: string, projectId?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // 生成唯一标识符
  const uniqueId = uuidv4();

  if (purpose === 'portfolio-asset') {
    return `portfolio/assets/${year}/${month}/${uniqueId}-${filename}`;
  } else {
    if (!projectId) {
      throw new BadRequestException({
        errorCode: 'MISSING_PROJECT_ID',
        message: '交付照片上传必须提供 projectId',
      });
    }

    const albumId = projectId;
    return `delivery/photos/${projectId}/${albumId}/${uniqueId}-${filename}`;
  }
}
```

---

### 错误处理与重试

**前端错误处理**：根据错误类型设置状态（error/canceled），支持手动重试

**后端错误响应**：返回结构化错误信息，包括错误码和提示

---

---

## 第三部分：实践示例

### 作品集素材上传示例

**完整流程**：

```typescript
// 1. 获取上传签名
POST /api/assets/sign
{
  "purpose": "portfolio-asset",
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 5242880,
  "workId": "work_123456"
}

// 返回
{
  "objectKey": "portfolio/assets/2025/01/a1b2c3d4-photo.jpg",
  "uploadStrategy": "s3-multipart",
  "uploadId": "upload_xyz789",
  "partSize": 5242880
}

// 2. 分片上传（假设 5MB，1 个分片）
POST /api/assets/multipart/sign-part { "partNumber": 1 }
← { "url": "https://..." }
PUT {url}
← ETag: "\"abc123\""

POST /api/assets/multipart/complete
{
  "parts": [{ "partNumber": 1, "etag": "\"abc123\"" }]
}
← { "ok": true }

// 3. 确认上传
POST /api/works/work_123456/assets/confirm
{
  "objectKey": "portfolio/assets/2025/01/a1b2c3d4-photo.jpg",
  "filename": "photo.jpg",
  "size": 5242880,
  "contentType": "image/jpeg",
  "type": "image"
}

// 返回
{
  "assetId": "asset_def456",
  "url": "https://...",
  "thumbnails": { "small": "...", "medium": "...", "large": "..." }
}
```

**前端组件使用**：

```tsx
import { AssetUpload } from '@/components/features/upload/asset-upload';

<AssetUpload purpose="portfolio-asset" workId="work_123456" concurrency={3} mode="auto" />;
```

---

### 交付照片上传示例

**完整流程**：类似作品集素材，但使用 `delivery-photo` purpose 和 `projectId`

**前端组件使用**：

```tsx
<AssetUpload purpose="delivery-photo" projectId="proj_789" concurrency={3} mode="auto" />
```

---

### 断点续传实现示例

**使用场景**：上传大文件时网络中断，恢复后继续上传

**实现原理**：利用 `listParts` 接口查询已上传的分片，跳过已完成的分片

```typescript
// 1. 列出已上传的分片
POST /api/assets/multipart/list-parts
{
  "objectKey": "...",
  "uploadId": "upload_abc"
}
← {
  "parts": [
    { "partNumber": 1, "etag": "\"part1\"" },
    { "partNumber": 2, "etag": "\"part2\"" }
  ]
}

// 2. 前端跳过已上传的分片（Part 1 和 Part 2）
for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
  if (completed.has(partNumber)) {
    console.log(`跳过 Part ${partNumber}（已上传）`);
    continue;  // 跳过已上传的分片
  }

  // 只上传 Part 3
  const url = await signUploadPart({ objectKey, uploadId, partNumber });
  await uploadPart({ url, blob: file.slice(...) });
}

// 3. 合并所有分片
POST /api/assets/multipart/complete
{
  "parts": [
    { "partNumber": 1, "etag": "\"part1\"" },  // 已上传
    { "partNumber": 2, "etag": "\"part2\"" },  // 已上传
    { "partNumber": 3, "etag": "\"part3\"" }   // 新上传
  ]
}
```

---

---

## 第四部分：总结与最佳实践

### 架构优势

1. **前后端分离，职责清晰**：前端负责直传和交互，后端负责签名和元数据管理
2. **存储抽象，易于切换**：StorageService 支持多种存储提供商
3. **断点续传，提升体验**：大文件上传更可靠
4. **并发控制，性能优化**：Pump 调度器维持并发数限制

---

### 性能优化建议

**前端优化**：

- 并发数配置：3-5 个并发
- 分片大小：5MB - 10MB
- 进度更新防抖

**后端优化**：

- 缓存签名结果（Redis）
- 异步处理耗时操作（队列 Worker）
- 数据库批量插入

**存储优化**：

- 选择合适的存储提供商
- 启用 CDN 加速
- 设置生命周期规则

---

### 安全性考虑

1. **文件类型验证**：前端 + 后端双重验证，魔数验证（TODO）
2. **文件大小限制**：前端 + 后端限制
3. **上传权限控制**：JWT 认证 + 项目归属验证
4. **签名过期时间**：1 小时（合理设置）

---

### 扩展性设计

1. **支持更多存储提供商**：扩展 StorageService（阿里云 OSS、AWS S3）
2. **支持更多文件类型**：PDF、3D 模型、HEIC 等
3. **支持更多上传场景**：用户头像、合同文档、样片等
4. **支持批量操作**：批量确认接口

---

## 📝 练习题

### 基础练习

1. **实现文件验证**：在前端添加文件尺寸限制（宽 x 高），防止上传超大图片
2. **实现进度条**：在 UI 中添加总体进度条，显示所有文件的上传进度
3. **实现错误重试**：添加自动重试机制，上传失败时自动重试 3 次

### 进阶练习

4. **实现压缩上传**：前端上传前压缩图片（质量 80%），减少上传时间
5. **实现断点续传优化**：持久化已上传分片信息，刷新页面后可继续上传
6. **实现批量上传**：拖拽文件夹，递归上传所有图片文件

### 挑战练习

7. **实现视频预览**：上传视频前生成缩略图和预览（使用 FFmpeg.wasm）
8. **实现 WebRTC 上传**：使用 WebRTC 数据通道上传，支持 P2P 加速
9. **实现客户端加密**：上传前加密文件（AES-256），服务器无法查看原始内容

---

## ⏭️ 下一节

[数据库设计与 ORM 集成](./06-database-design.md)

---

**返回阶段目录**：[README](./README.md)  
**返回教程首页**：[教程目录](../README.md)
