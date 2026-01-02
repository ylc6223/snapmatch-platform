# 图片上传功能实施总结（R2 版本）

> **实施日期**: 2025-01-02  
> **实施范围**: 后端上传接口（Cloudflare R2）+ Admin 上传组件联调  
> **技术栈**: Next.js（Admin）+ NestJS（Backend）

本仓库已**彻底移除七牛云方案**。本地开发默认使用 **Cloudflare R2（S3 兼容）**；生产环境后续可按需切换腾讯云 COS（当前后端尚未实现 `cos` provider）。

---

## 1. 总体方案（与 PRD 对齐）

统一采用“三段式流程”：

1. **拿上传通行证**：`POST /assets/sign`（统一入口，按 `purpose` 区分作品集素材/交付照片）
2. **前端直传对象存储**：R2 使用 S3 Multipart Upload（支持断点续传）
3. **登记入册**：上传完成后再调用确认接口
   - 交付照片：`POST /photos/confirm`
   - 作品集素材：`POST /works/:workId/assets/confirm`

---

## 2. 后端实现概览

### 2.1 云存储抽象层

- `apps/backend/src/common/storage/storage.interface.ts`
  - `IStorageProvider`：基础能力（上传凭证、下载签名、删除、存在性）
  - `IMultipartUploadProvider`：可选分片能力（断点续传）
- `apps/backend/src/common/storage/providers/r2.provider.ts`
  - Cloudflare R2（S3 兼容）实现：预签名 PUT、Multipart（create/sign/list/complete/abort）
- `apps/backend/src/common/storage/storage.service.ts`
  - 统一入口：通过 `STORAGE_PROVIDER` 选择 provider（当前支持 `r2`）

### 2.2 Assets 模块

- `apps/backend/src/assets/assets.controller.ts`
  - `POST /assets/sign`
  - `POST /assets/multipart/sign-part`
  - `POST /assets/multipart/list-parts`
  - `POST /assets/multipart/complete`
  - `POST /assets/multipart/abort`
  - `POST /photos/confirm`
  - `POST /works/:workId/assets/confirm`
- `apps/backend/src/assets/assets.service.ts`
  - 文件类型/大小校验
  - objectKey 规划
  - fileExists 校验 + URL 生成策略

---

## 3. 接口要点

### 3.1 `POST /api/assets/sign`

当 `STORAGE_PROVIDER=r2` 时，返回分片上传信息：

```json
{
  "token": "",
  "uploadUrl": "",
  "objectKey": "delivery/photos/<projectId>/<albumId>/<uuid>-a.jpg",
  "expiresIn": 3600,
  "uploadStrategy": "s3-multipart",
  "uploadId": "xxx",
  "partSize": 8388608
}
```

### 3.2 分片上传（断点续传）

- `POST /api/assets/multipart/list-parts`：列出已上传分片（用于续传跳过）
- `POST /api/assets/multipart/sign-part`：签一个分片上传 URL（前端 PUT）
- `POST /api/assets/multipart/complete`：合并分片（需要提供 `partNumber + etag`）

---

## 4. 本地配置与验证

- 配置说明：`docs/admin/r2-setup-summary.md`
- Swagger：`http://localhost:3002/api/v1/docs`
