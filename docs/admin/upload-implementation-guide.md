# 图片上传功能实施指南

> 本文档基于 `discuss/admin/upload-assets-signing-scheme.md` 和 `docs/admin/prd-breakdown-and-todos.md` 编写
>
> **目标**：为管理后台实现统一的图片上传能力，支持两种不同场景的作品素材和交付照片上传
>
> **云存储方案**：七牛云（开发阶段），未来将迁移至腾讯云 COS

---

## 📋 目录

1. [架构设计](#架构设计)
2. [云存储抽象层（迁移友好）](#云存储抽象层迁移友好)
3. [两种上传场景对比](#两种上传场景对比)
4. [后端接口设计](#后端接口设计)
5. [前端实现方案](#前端实现方案)
6. [开发步骤](#开发步骤)
7. [技术选型](#技术选型)
8. [云存储迁移策略](#云存储迁移策略)

---

## 架构设计

### 核心原则：统一签名、分开入库

```
┌─────────────────────────────────────────────────────────────────┐
│                         上传流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣ 前端请求签名                                                  │
│     POST /assets/sign                                            │
│     参数: { purpose, filename, contentType, size }               │
│                                                                  │
│  2️⃣ 后端返回上传凭证                                             │
│     { signUrl, objectKey, expiresIn }                            │
│                                                                  │
│  3️⃣ 前端直传云存储                                               │
│     使用 signUrl 直接上传文件到七牛云 Kodo                         │
│                                                                  │
│  4️⃣ 前端确认上传完成                                             │
│     作品集素材 → POST /works/:id/assets/confirm                 │
│     交付照片 → POST /photos/confirm                             │
│                                                                  │
│  5️⃣ 后端处理（异步）                                             │
│     • 保存元数据到数据库                                          │
│     • 触发图片处理（水印/缩略图/预览图）                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 两种上传场景对比

### 场景 1：作品集素材（Portfolio Assets）

**用途**：用于小程序展示的营销内容

- 作品封面图
- 作品图片集
- 轮播图
- 视频封面

**特征**：

- ✅ 允许上传图片和视频
- ✅ 不需要水印
- ✅ 公开读权限（小程序端访问）
- ✅ 归属「作品集管理」模块
- 📍 Admin 路由入口：`/dashboard/portfolio/works`

### 场景 2：交付照片（Delivery Photos）

**用途**：用于客户选片/交付链路

- 项目原片
- 预览图（强制水印）
- 缩略图
- 精修交付图

**特征**：

- ✅ 仅允许上传图片（后续可扩展视频）
- ✅ 必须生成带水印预览图
- ✅ 原图私有读权限（下载需鉴权）
- ✅ 归属「交付与选片管理」模块
- 📍 Admin 路由入口：`/dashboard/delivery/photos`

---

## 后端接口设计

### 1. 统一签名接口

**端点**：`POST /api/assets/sign`

**请求参数**：

```typescript
{
  purpose: 'portfolio-asset' | 'delivery-photo',
  filename: string,
  contentType: string,
  size: number,
  projectId?: string,  // 用于权限校验和路径规划（可选）
  workId?: string      // 用于权限校验和路径规划（可选）
}
```

**响应**：

```typescript
{
  signUrl: string,        // 临时上传 URL
  objectKey: string,      // 对象存储路径
  expiresIn: number,      // 过期时间（秒）
  method: 'PUT',          // 请求方法
  headers?: Record<string, string>  // 额外请求头
}
```

**后端职责**：

1. ✅ 鉴权校验（检查用户登录状态）
2. ✅ 权限校验（根据 `purpose` 检查对应权限）
3. ✅ 文件类型和大小限制
   - 作品集素材：图片 ≤ 20MB，视频 ≤ 200MB
   - 交付照片：图片 ≤ 50MB（后续可调整）
4. ✅ 生成云存储签名 URL
   - 当前使用七牛云 SDK（qiniu）
   - 生成上传 Token（uptoken）
5. ✅ 规划存储路径
   - 作品集素材：`portfolio/assets/{YYYY}/{MM}/{uuid}-{filename}`
   - 交付照片：`delivery/photos/{projectId}/{albumId}/{uuid}-{filename}`

---

### 2a. 作品集素材确认接口

**端点**：`POST /api/works/:workId/assets/confirm`

**请求参数**：

```typescript
{
  objectKey: string,      // 云存储对象键
  filename: string,
  size: number,
  contentType: string,
  type: 'image' | 'video',
  sort?: number,          // 排序权重
  isCover?: boolean       // 是否为封面
}
```

**响应**：

```typescript
{
  assetId: string,        // 资产 ID
  url: string,            // 访问 URL
  thumbnails?: {          // 缩略图（仅图片）
    small: string,        // 小图（200x200）
    medium: string,       // 中图（800x600）
    large: string         // 大图（1920x1080）
  }
}
```

**后端职责**：

1. ✅ 验证用户对 `workId` 的修改权限
2. ✅ 验证 `objectKey` 是否存在（云存储 HEAD 请求）
3. ✅ 保存资产元数据到数据库（WorkAsset 表）
4. ✅ 异步生成缩略图（队列 Worker）
5. ✅ 返回访问 URL

---

### 2b. 交付照片确认接口

**端点**：`POST /api/photos/confirm`

**请求参数**：

```typescript
{
  projectId: string,
  albumId?: string,       // 子相册 ID（可选）
  objectKey: string,      // 云存储对象键（原图）
  filename: string,
  size: number,
  contentType: string,
  exif?: {               // EXIF 信息（可选，后续可自动提取）
    camera: string,
    lens: string,
    iso: number,
    aperture: string,
    shutter: string
  }
}
```

**响应**：

```typescript
{
  photoId: string,
  status: 'processing' | 'ready',
  variants: {
    thumbnail: string,    // 缩略图 URL
    preview: string,      // 预览图 URL（带水印）
    original: string      // 原图 URL（私有读，临时签名）
  }
}
```

**后端职责**：

1. ✅ 验证用户对 `projectId` 的修改权限
2. ✅ 验证 `objectKey` 是否存在
3. ✅ 保存照片元数据到数据库（Photo 表）
4. ✅ **异步处理**（队列 Worker）：
   - 生成缩略图（列表展示，300x300）
   - 生成预览图（选片用，1920x1080 + 强制水印）
   - 保留原图（私有读权限）
5. ✅ 返回处理状态

---

## 前端实现方案

### 上传组件设计

**推荐使用组件库**：

- `apps/admin` 使用 vben-admin，基于 Vue 3 + Ant Design Vue
- 使用 `a-upload` 组件并自定义上传行为

**核心上传组件**：

```vue
<!-- components/AssetUpload.vue -->
<template>
  <a-upload
    :custom-request="handleUpload"
    :before-upload="beforeUpload"
    :multiple="true"
    :show-upload-list="true"
    list-type="picture-card"
  >
    <div v-if="fileList.length < maxCount">
      <plus-outlined />
      <div class="ant-upload-text">上传</div>
    </div>
  </a-upload>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { uploadAsset } from '@/api/assets';
import { confirmWorkAsset, confirmPhoto } from '@/api/assets';

const props = defineProps<{
  purpose: 'portfolio-asset' | 'delivery-photo';
  maxCount?: number;
  maxSize?: number; // MB
  projectId?: string;
  workId?: string;
  onSuccess?: (file: UploadedFile) => void;
}>();

const handleUpload = async (options: any) => {
  const { file, onProgress, onSuccess, onError } = options;

  try {
    // 1️⃣ 获取签名
    const signResult = await uploadAsset({
      purpose: props.purpose,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      projectId: props.projectId,
      workId: props.workId,
    });

    // 2️⃣ 直传云存储
    await axios.put(signResult.signUrl, file, {
      onUploadProgress: (e) => {
        onProgress({ percent: (e.loaded / e.total) * 100 }, file);
      },
    });

    // 3️⃣ 确认上传
    let confirmResult;
    if (props.purpose === 'portfolio-asset') {
      confirmResult = await confirmWorkAsset(props.workId!, {
        objectKey: signResult.objectKey,
        filename: file.name,
        size: file.size,
        contentType: file.type,
        type: file.type.startsWith('image/') ? 'image' : 'video',
      });
    } else {
      confirmResult = await confirmPhoto({
        projectId: props.projectId!,
        objectKey: signResult.objectKey,
        filename: file.name,
        size: file.size,
        contentType: file.type,
      });
    }

    onSuccess(confirmResult, file);
    props.onSuccess?.(confirmResult);
    message.success('上传成功');
  } catch (error) {
    onError(error);
    message.error('上传失败');
  }
};

const beforeUpload = (file: File) => {
  const isValidSize = file.size <= (props.maxSize || 50) * 1024 * 1024;
  if (!isValidSize) {
    message.error(`文件大小不能超过 ${props.maxSize || 50}MB`);
  }
  return isValidSize;
};
</script>
```

---

## 云存储抽象层（迁移友好）

### 设计目标

为了在开发阶段使用七牛云，并在未来平滑迁移到腾讯云 COS，我们需要在代码中引入**云存储抽象层**。

### 抽象层接口设计

```typescript
// apps/backend/src/common/storage/storage.interface.ts

export interface IStorageProvider {
  /**
   * 生成上传凭证
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒）
   */
  generateUploadToken(
    objectKey: string,
    expiresIn: number,
  ): Promise<{
    token: string; // 上传凭证
    uploadUrl: string; // 上传端点 URL
    objectKey: string; // 对象键
  }>;

  /**
   * 获取公开访问 URL
   * @param objectKey 对象存储路径
   */
  getPublicUrl(objectKey: string): string;

  /**
   * 生成私有下载凭证（临时签名 URL）
   * @param objectKey 对象存储路径
   * @param expiresIn 过期时间（秒），默认 3600
   */
  generatePrivateDownloadUrl(objectKey: string, expiresIn?: number): Promise<string>;

  /**
   * 删除文件
   * @param objectKey 对象存储路径
   */
  deleteFile(objectKey: string): Promise<void>;

  /**
   * 批量删除文件
   * @param objectKeys 对象存储路径数组
   */
  deleteFiles(objectKeys: string[]): Promise<void>;

  /**
   * 检查文件是否存在
   * @param objectKey 对象存储路径
   */
  fileExists(objectKey: string): Promise<boolean>;
}
```

### 七牛云实现（当前）

```typescript
// apps/backend/src/common/storage/providers/qiniu.provider.ts

import { Injectable } from '@nestjs/common';
import * as qiniu from 'qiniu';
import { IStorageProvider } from '../storage.interface';

@Injectable()
export class QiniuStorageProvider implements IStorageProvider {
  private mac: qiniu.auth.digest.Mac;
  private config: qiniu.conf.Config;
  private bucketManager: qiniu.rs.BucketManager;

  constructor() {
    // 从环境变量读取配置
    this.mac = new qiniu.auth.digest.Mac(
      process.env.QINIU_ACCESS_KEY,
      process.env.QINIU_SECRET_KEY,
    );

    this.config = new qiniu.conf.Config();
    this.config.zone = qiniu.zone.Zone_z0; // 华东区

    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  async generateUploadToken(objectKey: string, expiresIn: number) {
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${process.env.QINIU_BUCKET}:${objectKey}`,
      expires: expiresIn,
    });

    const token = putPolicy.uploadToken(this.mac);

    return {
      token,
      uploadUrl: `https://upload.qiniup.com`,
      objectKey,
    };
  }

  getPublicUrl(objectKey: string): string {
    const domain = process.env.QINIU_DOMAIN; // 配置的 CDN 域名
    return `${domain}/${objectKey}`;
  }

  async generatePrivateDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
    const baseUrl = this.getPublicUrl(objectKey);
    const deadline = Math.floor(Date.now() / 1000) + expiresIn;

    return qiniu.util.privateDownloadUrl(this.mac, baseUrl, deadline);
  }

  async deleteFile(objectKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(process.env.QINIU_BUCKET, objectKey, (err, respBody, respInfo) => {
        if (err) reject(err);
        else if (respInfo.statusCode === 200) resolve();
        else reject(new Error(respBody.error));
      });
    });
  }

  async deleteFiles(objectKeys: string[]): Promise<void> {
    const deleteOps = objectKeys.map((key) => qiniu.rs.deleteOp(process.env.QINIU_BUCKET, key));

    return new Promise((resolve, reject) => {
      this.bucketManager.batch(deleteOps, (err, respBody, respInfo) => {
        if (err) reject(err);
        else if (respInfo.statusCode === 200) resolve();
        else reject(new Error(respBody.toString()));
      });
    });
  }

  async fileExists(objectKey: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(process.env.QINIU_BUCKET, objectKey, (err, respBody, respInfo) => {
        if (err) reject(err);
        else resolve(respInfo.statusCode === 200);
      });
    });
  }
}
```

### 腾讯云 COS 实现（未来）

```typescript
// apps/backend/src/common/storage/providers/cos.provider.ts

import { Injectable } from '@nestjs/common';
import * as COS from 'cos-nodejs-sdk-v5';
import { IStorageProvider } from '../storage.interface';

@Injectable()
export class CosStorageProvider implements IStorageProvider {
  private cos: COS;

  constructor() {
    this.cos = new COS({
      SecretId: process.env.COS_SECRET_ID,
      SecretKey: process.env.COS_SECRET_KEY,
    });
  }

  async generateUploadToken(objectKey: string, expiresIn: number) {
    const signUrl = this.cos.getObjectUrl({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: objectKey,
      Method: 'PUT',
      Sign: true,
      Expires: expiresIn,
    });

    return {
      token: signUrl, // COS 使用签名 URL
      uploadUrl: signUrl,
      objectKey,
    };
  }

  getPublicUrl(objectKey: string): string {
    const domain = process.env.COS_DOMAIN;
    return `${domain}/${objectKey}`;
  }

  async generatePrivateDownloadUrl(objectKey: string, expiresIn = 3600): Promise<string> {
    return this.cos.getObjectUrl({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: objectKey,
      Sign: true,
      Expires: expiresIn,
    });
  }

  async deleteFile(objectKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: process.env.COS_BUCKET,
          Region: process.env.COS_REGION,
          Key: objectKey,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  async deleteFiles(objectKeys: string[]): Promise<void> {
    await Promise.all(objectKeys.map((key) => this.deleteFile(key)));
  }

  async fileExists(objectKey: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.cos.headObject(
        {
          Bucket: process.env.COS_BUCKET,
          Region: process.env.COS_REGION,
          Key: objectKey,
        },
        (err, data) => {
          if (err) {
            if (err.statusCode === 404) resolve(false);
            else reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  }
}
```

### Storage 服务（统一入口）

```typescript
// apps/backend/src/common/storage/storage.service.ts

import { Injectable } from '@nestjs/common';
import { QiniuStorageProvider } from './providers/qiniu.provider';
import { CosStorageProvider } from './providers/cos.provider';
import { IStorageProvider } from './storage.interface';

@Injectable()
export class StorageService implements IStorageProvider {
  private provider: IStorageProvider;

  constructor() {
    // 根据环境变量选择提供商
    const providerType = process.env.STORAGE_PROVIDER || 'qiniu';

    if (providerType === 'cos') {
      this.provider = new CosStorageProvider();
    } else {
      this.provider = new QiniuStorageProvider();
    }
  }

  async generateUploadToken(objectKey: string, expiresIn: number) {
    return this.provider.generateUploadToken(objectKey, expiresIn);
  }

  getPublicUrl(objectKey: string): string {
    return this.provider.getPublicUrl(objectKey);
  }

  async generatePrivateDownloadUrl(objectKey: string, expiresIn?: number): Promise<string> {
    return this.provider.generatePrivateDownloadUrl(objectKey, expiresIn);
  }

  async deleteFile(objectKey: string): Promise<void> {
    return this.provider.deleteFile(objectKey);
  }

  async deleteFiles(objectKeys: string[]): Promise<void> {
    return this.provider.deleteFiles(objectKeys);
  }

  async fileExists(objectKey: string): Promise<boolean> {
    return this.provider.fileExists(objectKey);
  }
}
```

### 环境变量配置

```bash
# .env.local（七牛云，当前）
STORAGE_PROVIDER=qiniu
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=snapmatch-photos
QINIU_DOMAIN=https://cdn.snapmatch.com

# .env.production（腾讯云 COS，未来）
STORAGE_PROVIDER=cos
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=snapmatch-photos-1234567890
COS_REGION=ap-guangzhou
COS_DOMAIN=https://snapmatch-photos.cos.ap-guangzhou.myqcloud.com
```

---

## 开发步骤

### Phase 1: 后端基础设施（1-2 天）

**步骤 1**：创建资产模块

```bash
cd apps/backend
nest g module assets
nest g controller assets
nest g service assets
```

**步骤 2**：配置七牛云存储

- 在 `.env.local` 中添加七牛云配置
- 确认已开通七牛云存储服务
- 安装七牛云 SDK：`pnpm add qiniu`
- 创建云存储抽象层（便于未来迁移）

**步骤 3**：实现签名接口

- 实现 `POST /api/assets/sign`
- 添加权限 Guard（RBAC）
- 添加文件类型和大小校验
- 生成临时上传 URL

**步骤 4**：实现确认接口

- 实现 `POST /api/photos/confirm`
- 实现 `POST /api/works/:id/assets/confirm`
- 添加数据库 Model（Photo, WorkAsset）

**步骤 5**：配置图片处理队列（可选，P1）

- 使用 BullMQ 或 NestJS Scheduler
- 实现缩略图生成 Worker
- 实现水印添加 Worker

---

### Phase 2: 前端组件（1-2 天）

**步骤 1**：创建 API 请求封装

```typescript
// apps/admin/src/api/assets.ts
import { request } from '@vueuse/core';

export interface UploadAssetParams {
  purpose: 'portfolio-asset' | 'delivery-photo';
  filename: string;
  contentType: string;
  size: number;
  projectId?: string;
  workId?: string;
}

export const uploadAsset = (params: UploadAssetParams) => {
  return request<SignResult>('/api/assets/sign', {
    method: 'POST',
    body: params,
  });
};

export const confirmPhoto = (data: ConfirmPhotoParams) => {
  return request('/api/photos/confirm', {
    method: 'POST',
    body: data,
  });
};

export const confirmWorkAsset = (workId: string, data: ConfirmWorkAssetParams) => {
  return request(`/api/works/${workId}/assets/confirm`, {
    method: 'POST',
    body: data,
  });
};
```

**步骤 2**：创建上传组件

- 实现 `AssetUpload.vue`
- 支持拖拽上传
- 显示上传进度
- 失败重试机制

**步骤 3**：集成到页面

- 作品集编辑页：`/dashboard/portfolio/works/:id/edit`
- 照片库页：`/dashboard/delivery/photos`

---

### Phase 3: 测试与优化（1 天）

**步骤 1**：功能测试

- 测试不同文件类型（JPG, PNG, HEIC）
- 测试大文件上传（> 20MB）
- 测试并发上传
- 测试网络中断重试

**步骤 2**：权限测试

- 测试不同角色的上传权限
- 测试跨项目访问限制

**步骤 3**：性能优化

- 添加上传队列管理
- 实现断点续传（可选）
- CDN 加速配置

---

## 技术选型

### 云存储：七牛云（当前）→ 腾讯云 COS（未来）

**当前方案：七牛云 Kodo**

**优势**：

- ✅ 开发阶段快速上手，文档友好
- ✅ 提供 Node.js SDK（`qiniu`）
- ✅ 支持上传 Token（uptoken）直传
- ✅ 支持图片处理（缩略图、水印、格式转换）
- ✅ 提供 CDN 加速
- ✅ 私有读权限控制（临时签名 URL）

**SDK 安装**：

```bash
pnpm add qiniu
```

**签名生成示例**：

```typescript
import * as qiniu from 'qiniu';

const mac = new qiniu.auth.digest.Mac(process.env.QINIU_ACCESS_KEY, process.env.QINIU_SECRET_KEY);

const putPolicy = new qiniu.rs.PutPolicy({
  scope: `${bucket}:${objectKey}`,
  expires: 3600, // 1 小时
});

const uploadToken = putPolicy.uploadToken(mac);
```

**未来迁移：腾讯云 COS**

**优势**：

- ✅ 与 CloudBase 集成更好
- ✅ 企业级可靠性保证
- ✅ 数据万象（图片处理）功能强大
- ✅ 支持STS临时凭证

**迁移成本**：

- ✅ 通过抽象层隔离，切换成本低
- ✅ 数据迁移可使用七牛云提供的迁移工具
- ✅ 前端代码无需修改（接口保持兼容）

---

### 图片处理方案

**方案 A：七牛云图片处理（当前）**

- 使用数据处理管道（imageView2、imageMogr2）
- 自动生成缩略图、水印、格式转换
- URL 级别的图片处理参数
- 文档：https://developer.qiniu.com/dora/api/1279/basic-processing-images-imageview2

**示例**：

```typescript
// 缩略图
const thumbnailUrl = `${publicUrl}?imageView2/2/w/300/h/300`;

// 水印
const watermarkedUrl = `${publicUrl}?watermark/1/image/aHR0cDovL2xvZ28ucG5n/dissolve/50/gravity/SouthEast`;
```

**方案 B：腾讯云数据万象（未来）**

- 自动生成缩略图
- 添加水印（图片/文字）
- 图片格式转换
- 文档：https://cloud.tencent.com/document/product/436/44880

**方案 C：后端 Worker 处理（可选）**

- 使用 Sharp（Node.js）
- 更灵活的业务逻辑
- 可集成自定义水印
- 便于跨云存储统一处理逻辑

---

## 数据库设计

### Photo 表（交付照片）

```typescript
{
  _id: ObjectId;
  projectId: ObjectId;      // 关联项目
  albumId?: ObjectId;       // 关联子相册
  filename: string;
  size: number;
  contentType: string;

  // 存储路径
  objectKey: string;        // 原图路径
  thumbnailKey?: string;    // 缩略图路径
  previewKey?: string;      // 预览图路径（水印）

  // 处理状态
  status: 'processing' | 'ready' | 'failed';

  // EXIF 信息（可选）
  exif?: {
    camera: string;
    lens: string;
    iso: number;
    aperture: string;
    shutter: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### WorkAsset 表（作品集素材）

```typescript
{
  _id: ObjectId;
  workId: ObjectId;         // 关联作品
  type: 'image' | 'video';
  filename: string;
  size: number;
  contentType: string;

  // 存储路径
  objectKey: string;
  thumbnailKey?: string;    // 仅图片有缩略图

  // 展示属性
  sort: number;             // 排序权重
  isCover: boolean;         // 是否为封面

  createdAt: Date;
}
```

---

### 断点续传方案（可选，P1）

**推荐使用**：

- **七牛云分片上传**（当前）：支持大文件分片上传
- 前端库：`qiniu-js-sdk`（Web）

**示例**：

```typescript
import * as qiniu from 'qiniu-js';

const observable = qiniu.upload(
  file,
  objectKey,
  uploadToken,
  {
    useCdnDomain: true,
    region: qiniu.region.z0,
  },
  {
    useCdnDomain: true,
    uphost: 'https://upload.qiniup.com',
  },
);

const subscription = observable.subscribe({
  next(res) {
    console.log(`进度: ${res.total.percent}%`);
  },
  error(err) {
    console.error(err);
  },
  complete(res) {
    console.log('上传完成', res);
  },
});
```

**未来迁移**：

- 腾讯云 COS 分片上传 API 类似
- 通过抽象层封装，前端代码可复用

---

## 云存储迁移策略

### 迁移时机

建议在以下情况考虑迁移到腾讯云 COS：

1. 项目进入生产环境，需要更高的可靠性保证
2. 与 CloudBase 其他能力深度集成
3. 腾讯云提供更优惠的套餐或支持政策

### 迁移步骤

**阶段 1：准备工作**

1. **创建腾讯云 COS 存储桶**
   - 开通腾讯云 COS 服务
   - 创建存储桶（建议同地域：华南区广州）
   - 配置 CDN 加速域名

2. **环境变量配置**

   ```bash
   # .env.production
   STORAGE_PROVIDER=cos
   COS_SECRET_ID=xxx
   COS_SECRET_KEY=xxx
   COS_BUCKET=snapmatch-photos-xxx
   COS_REGION=ap-guangzhou
   COS_DOMAIN=https://snapmatch-photos.cos.ap-guangzhou.myqcloud.com
   ```

3. **代码实现**
   - 实现 `CosStorageProvider`（文档已提供代码模板）
   - 确保所有接口通过 `StorageService` 调用

**阶段 2：数据迁移**

1. **使用七牛云迁移工具**
   - 七牛云提供 kodo-import 工具
   - 支持从其他云存储批量迁移数据

2. **迁移命令示例**

   ```bash
   # 安装迁移工具
   go install github.com/qiniu/kodo-import@latest

   # 执行迁移
   kodo-import import \
     --source-qiniubucket snapmatch-photos \
     --dest-cosbucket snapmatch-photos-xxx \
     --dest-region ap-guangzhou \
     --dest-secret-id xxx \
     --dest-secret-key xxx
   ```

3. **验证数据完整性**
   - 对比文件数量
   - 抽样验证文件内容
   - 验证权限配置

**阶段 3：切换验证**

1. **灰度发布**
   - 修改环境变量 `STORAGE_PROVIDER=cos`
   - 先在测试环境验证
   - 小流量上线（10% → 50% → 100%）

2. **回滚预案**
   - 保留七牛云数据 1-2 周
   - 环境变量快速切回 `STORAGE_PROVIDER=qiniu`
   - 监控错误率和上传成功率

3. **监控指标**
   - 上传成功率
   - 平均上传耗时
   - 图片处理耗时
   - API 错误率

### 迁移风险控制

| 风险             | 应对措施                               |
| ---------------- | -------------------------------------- |
| **数据丢失**     | 迁移前备份七牛云数据；保留原数据 2 周  |
| **接口不兼容**   | 通过抽象层统一接口；充分测试           |
| **性能下降**     | 灰度发布并监控；必要时切换回七牛云     |
| **权限配置错误** | 在测试环境充分验证；使用最小权限原则   |
| **成本上升**     | 对比两家云存储报价；选择合适的存储类型 |

### 迁移后优化

1. **清理旧数据**
   - 验证无误后，删除七牛云数据
   - 取消七牛云订阅（避免额外费用）

2. **性能优化**
   - 启用腾讯云 CDN 加速
   - 配置图片处理模板
   - 启用智能压缩（WebP/AVIF）

3. **成本优化**
   - 使用生命周期管理（归档旧数据）
   - 开启数据压缩
   - 选择合适的存储类型（标准/低频/归档）

---

## 安全考虑

### 1. 文件类型校验

- 后端根据 `purpose` 限制允许的 MIME 类型
- 检查文件魔数（不只是文件扩展名）

### 2. 文件大小限制

- 作品集素材：图片 ≤ 20MB，视频 ≤ 200MB
- 交付照片：图片 ≤ 50MB
- 防止 DOS 攻击

### 3. 权限校验

- 使用 NestJS Guard 拦截请求
- 根据 `purpose` 和 `projectId`/`workId` 校验用户权限

### 4. 私有读权限

- 交付照片原图必须设为私有读
- 下载时生成临时签名 URL（有效期 5 分钟）

---

## API 端点清单

| 端点                            | 方法 | 描述             | 权限           |
| ------------------------------- | ---- | ---------------- | -------------- |
| `/api/assets/sign`              | POST | 获取上传签名     | `staff`        |
| `/api/photos/confirm`           | POST | 确认交付照片     | `photographer` |
| `/api/works/:id/assets/confirm` | POST | 确认作品集素材   | `admin`        |
| `/api/photos/:id`               | GET  | 获取照片详情     | `staff`        |
| `/api/photos/:id/download`      | GET  | 下载原图         | `photographer` |
| `/api/works/:id/assets`         | GET  | 获取作品素材列表 | `staff`        |

---

## 下一步行动

### 当前阶段（七牛云）

1. ✅ **配置七牛云环境**：
   - 注册七牛云账号并创建存储空间
   - 在 `.env.local` 中添加七牛云配置
   - 安装七牛云 SDK：`pnpm add qiniu`

2. ✅ **创建云存储抽象层**：
   - 创建 `storage.interface.ts` 接口文件
   - 实现 `QiniuStorageProvider`
   - 实现 `StorageService` 统一入口

3. ✅ **实现后端接口**：
   - 使用 NestJS CLI 生成 assets 模块
   - 实现 `POST /api/assets/sign` 签名接口
   - 实现 `POST /api/photos/confirm` 确认接口
   - 实现 `POST /api/works/:id/assets/confirm` 确认接口

4. ✅ **测试上传流程**：
   - 测试签名生成
   - 测试直传七牛云
   - 测试确认上传完成
   - 验证数据库记录

5. ✅ **创建前端组件**：
   - 实现 `AssetUpload.vue` 组件
   - 集成到作品集编辑页
   - 集成到照片库页

### 未来迁移（腾讯云 COS）

1. ⏸️ **创建 COS Provider**（按需）
   - 实现 `CosStorageProvider`
   - 添加到 `StorageService` 的工厂方法

2. ⏸️ **数据迁移**（按需）
   - 使用迁移工具批量迁移数据
   - 验证数据完整性

3. ⏸️ **灰度切换**（按需）
   - 修改环境变量 `STORAGE_PROVIDER=cos`
   - 逐步切换流量

---

## 参考资源

### 七牛云文档（当前）

- **七牛云 Node.js SDK**：https://developer.qiniu.com/sdk#official-sdk
- **七牛云上传策略**：https://developer.qiniu.com/kodo/manual/1206/put-policy
- **七牛云图片处理**：https://developer.qiniu.com/dora/api/1279/basic-processing-images-imageview2
- **七牛云 JavaScript SDK**：https://developer.qiniu.com/sdk#community-sdk

### 腾讯云文档（未来）

- **腾讯云 COS Node.js SDK**：https://cloud.tencent.com/document/product/436/8629
- **腾讯云 COS 文档**：https://cloud.tencent.com/document/product/436
- **数据万象（图片处理）**：https://cloud.tencent.com/document/product/436/44880
- **CloudBase Node SDK**：https://docs.cloudbase.net/api-reference/node-sdk/overview.html

### 项目文档

- **项目 PRD 文档**：`docs/admin/prd.md`
- **上传方案详细设计**：`discuss/admin/upload-assets-signing-scheme.md`
- **PRD 拆解与任务分配**：`discuss/admin/prd-breakdown-and-todos.md`

### 迁移工具

- **七牛云数据迁移工具**：https://github.com/qiniu/kodo-import
- **腾讯云数据迁移服务**：https://cloud.tencent.com/document/product/436/30628

---

**文档版本**：v2.0
**更新日期**：2025-01-02
**维护者**：SnapMatch Platform Team
**变更记录**：

- v1.0 (2025-01-02): 初始版本，基于腾讯云 COS
- v2.0 (2025-01-02): 调整为七牛云（当前）+ 腾讯云 COS（未来），添加云存储抽象层和迁移策略
