# Cloudflare R2 配置摘要（本地开发）

本项目已移除七牛云方案，当前本地开发推荐使用 **Cloudflare R2（S3 兼容）** 作为对象存储；生产环境后续可按需切换到腾讯云 COS（当前后端尚未实现 `cos` provider）。

## 1. 你需要准备什么

- 一个 Cloudflare 账号
- 已开通 R2
- 创建一个 R2 Bucket（例如 `snapmatch-dev`）
- 创建 R2 API Token（含读写 bucket 权限），拿到：
  - `Access Key ID`
  - `Secret Access Key`
  - `S3 API endpoint`（形如：`https://<accountid>.r2.cloudflarestorage.com`）

## 2. 后端环境变量

在 `apps/backend/.env.local` 填写（示例）：

```bash
STORAGE_PROVIDER=r2

R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET=snapmatch-dev

# 可选：作品集素材的公开访问域名（用于返回稳定可访问的 URL）
# 如果不配置，后端会在 R2 下回退返回临时签名 URL（用于联调）。
R2_PUBLIC_DOMAIN=https://assets-dev.example.com

# 可选：分片大小（字节，>= 5MB；默认 8MB）
# R2_PART_SIZE_BYTES=8388608
```

## 3. 本地联调方式

1. 启动后端：`pnpm dev:backend`
2. 启动 Admin：`pnpm dev:admin`
3. 打开 Admin 的上传预览页（仓库内已有 dev 页面），分别测试：
   - `作品集素材`：上传图片 → 确认接口返回 URL
   - `交付照片`：上传图片 → 确认接口返回原图签名 URL（临时）

## 4. 关于“公开/私有”的业务约定（来自 PRD）

- **交付照片**：原图私有；未来应通过鉴权 + 临时签名 URL 下载（或走后端代理）。
- **作品集素材**：用于营销展示，通常应走公开 CDN 域名（推荐配置 `R2_PUBLIC_DOMAIN`）。
