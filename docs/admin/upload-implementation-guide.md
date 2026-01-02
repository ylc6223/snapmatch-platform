# 图片上传实现指南（R2 版）

本文档用于说明当前仓库的“图片上传”落地方案：**本地开发使用 Cloudflare R2（S3 兼容）**，并按 PRD 区分“作品集素材”与“交付照片”两条业务链路。

> 参考：`discuss/admin/upload-assets-signing-scheme.md`、`docs/admin/prd.md`

---

## 1. 一句话总结（大白话）

1. 先找后端拿“上传通行证”（包含 objectKey、uploadId、partSize 等）。
2. 浏览器把文件**直接上传到 R2**（分片上传，支持断点续传）。
3. 上传完再告诉后端“我传完了”（confirm），后端校验文件存在并返回可访问 URL。

---

## 2. 业务场景与访问策略（来自 PRD）

### 2.1 作品集素材（portfolio-asset）

- 用途：营销展示（作品图、封面、轮播图等）
- 访问：通常应 **公开可访问**（CDN/自定义域名）
- 本地联调：若没有配置公开域名，后端会回退返回“临时签名 URL”（便于开发）

### 2.2 交付照片（delivery-photo）

- 用途：客户选片/交付链路
- 访问：**原图私有**；预览图/缩略图未来通过“选片链接 token”访问
- 当前实现：confirm 接口返回 `original` 的临时签名 URL（便于联调与后续落库）

---

## 3. 接口与调用链（Admin → Backend）

注意：`apps/admin` 通过 BFF 转发 `/api/*` 到后端 `/api/v1/*`（见 `apps/admin/app/api/[...path]/route.ts`）。

### 3.1 拿通行证：`POST /api/assets/sign`

- 入参：`purpose/filename/contentType/size`（交付照片额外需要 `projectId`）
- 出参（R2）：`uploadStrategy=s3-multipart` + `uploadId` + `partSize` + `objectKey`

### 3.2 分片上传（断点续传）

- `POST /api/assets/multipart/list-parts`：列出已上传分片（断点续传的关键）
- `POST /api/assets/multipart/sign-part`：签一个分片上传 URL（返回 `url`）
- 浏览器 `PUT` 分片到该 `url`，并读取响应头 `ETag`
- `POST /api/assets/multipart/complete`：把 `partNumber + etag` 列表交给后端合并

### 3.3 登记入册（确认）

上传完后调用：

- 交付照片：`POST /api/photos/confirm`
- 作品集素材：`POST /api/works/:workId/assets/confirm`

后端会做 `fileExists(objectKey)` 校验，避免前端伪造 objectKey。

---

## 4. 代码位置

### 4.1 后端（NestJS）

- R2 Provider：`apps/backend/src/common/storage/providers/r2.provider.ts`
- 存储服务：`apps/backend/src/common/storage/storage.service.ts`
- 上传/确认接口：`apps/backend/src/assets/assets.controller.ts`
- 业务逻辑：`apps/backend/src/assets/assets.service.ts`

### 4.2 Admin（Next.js）

- 上传组件：`apps/admin/components/asset-upload.tsx`
  - 自动走 `s3-multipart` 分片上传
  - 失败重试/断线后重试会先 `list-parts` 跳过已上传分片继续传

---

## 5. 本地配置

见：`docs/admin/r2-setup-summary.md`

---

## 6. 生产环境（后续迭代：COS）

当前后端仅实现 `r2` provider，`cos` 仅保留占位。未来迁移到 COS 的思路是：

- 继续沿用同一套接口（`/assets/sign` + multipart endpoints）
- provider 切到 `cos`（实现同样的 S3 multipart 签名能力）
- 前端上传逻辑无需变更
