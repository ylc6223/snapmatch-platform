# 客户选片“链接直达”方案说明（备份）

本文用于备份“客户 PC 选片端（Viewer）通过选片链接直达”的落地方案，目标是在不做微信扫码/手机号登录的前提下，实现安全可控的客户访问与数据隔离。

---

## 1. 背景与目标

### 1.1 背景

- 短期内微信扫码/手机号登录实现成本较高，暂时搁置。
- 客户侧需要一个“打开链接即可选片”的体验入口。

### 1.2 目标

- Admin 生成一条不可猜测的选片链接：`/client/selection/{token}`
- 客户打开链接即可进入对应项目的选片 Viewer（无需登录）
- 选片支持草稿实时保存与最终提交锁定
- Admin 可撤销/重置链接，链接支持过期策略
- 严格数据隔离：客户 A 不能通过改 URL 看到客户 B 的内容

### 1.3 非目标（短期不做）

- 微信扫码登录
- 手机号验证码登录

---

## 2. 核心设计：ViewerLink（访问令牌）= Opaque Token + 服务端校验

### 2.1 Token 形态（推荐）

- 使用随机不可猜测的 **不透明 token（opaque token）**：
  - 建议：随机 32 字节以上，base64url 编码；或使用更长随机串
- 数据库只存 `tokenHash`，不存明文 token：
  - 推荐 `tokenHash = sha256(token)`
  - 防止数据库泄露导致所有链接直接可用

### 2.2 ViewerLink 数据结构（概念字段）

- `id`
- `projectId`
- `tokenHash`
- `status`: `active | revoked`
- `expiresAt`
- `createdAt`、`createdBy`
- 可选：`lastAccessAt`、`accessCount`
- 可选：`submittedAt`（若提交后要限制再编辑）
- 可选：`bindCustomerUserId`（未来接入客户登录后可绑定）

---

## 3. 端到端流程（直达选片）

### 3.1 Admin 生成链接

1. Admin 在项目详情点击“生成选片链接”
2. 后端生成随机 `token`，计算 `tokenHash` 并存储：`projectId + tokenHash + expiresAt`
3. 后端返回 token 或完整 URL
4. Admin 展示链接并支持“一键复制/重置/撤销”

UX 建议：

- 展示“有效期/撤销/重置”能力
- “重置”应撤销旧 token 并生成新 token（旧链接立即失效）

### 3.2 客户打开链接进入 Viewer

1. 客户访问页面：`/client/selection/{token}`
2. Viewer 页面携带 token 请求后端：`GET /viewer/{token}`
3. 后端校验 token（hash 匹配、未撤销、未过期），返回：
   - 项目信息（名称、套餐张数、截止日期等）
   - 可见照片列表（仅缩略图/预览图）
   - 当前 selection 草稿/提交状态

### 3.3 选片实时保存（草稿）

- 客户每次标记（或 debounce）调用：`PUT /viewer/{token}/selection`
- 后端校验 token → 以 token 推导的 `projectId/linkId` 写入草稿数据

### 3.4 提交锁定

- 客户点击“确认选片”调用：`POST /viewer/{token}/submit`
- 后端：
  - 校验 token、截止日期、项目状态等
  - 将 selection 标记为 `submitted/locked`，写 `submittedAt`
  - 可选：提交后将该 ViewerLink 标记为 `submitted` 或直接 `revoked`（取决于是否允许继续打开链接查看结果）
  - 触发通知（给 `photographer/sales`）

---

## 4. 接口建议（与现有 Admin BFF / Backend 结构兼容）

### 4.1 Admin 侧（需要登录 + RBAC）

- `POST /api/v1/projects/:id/viewer-links`：生成链接
- `POST /api/v1/viewer-links/:id/revoke`：撤销链接
- `POST /api/v1/projects/:id/viewer-links/rotate`：重置链接（撤销旧的并生成新的）

建议权限：

- `admin/photographer/sales` 可生成与管理链接（具体按业务收敛）

### 4.2 Viewer 侧（公开接口，但必须持有 token）

> 公开的含义：不走员工 JWT 登录态；而是走 token 鉴权（访问令牌即凭证）。

- `GET /api/v1/viewer/:token`：拉取项目与可见照片、套餐规则、当前草稿
- `PUT /api/v1/viewer/:token/selection`：保存草稿（幂等/可覆盖）
- `POST /api/v1/viewer/:token/submit`：提交并锁定

实现建议：

- 在后端 Controller 上使用 `@Public()` 放行 JWT Guard，然后在业务内部校验 token

---

## 5. 安全与性能要点（关键决策）

### 5.1 照片 URL 返回策略（非常关键）

最低要求：Viewer 只能拿到 **预览图/缩略图**，禁止直接拿原图。

推荐优先级：

1. **预览图公开 CDN（强制水印）**：Viewer 直接使用 URL 渲染，性能最好
2. **预览图私有 + 临时签名 URL**：更安全，但需要批量签名与缓存/过期管理，复杂度更高

短期建议：

- 预览图可公开（带水印）
- 原图永远私有；下载原图必须走员工登录态 + 权限校验 + 临时 URL

### 5.2 Token 风控建议

- token 长度足够且随机（不可猜）
- 数据库存 hash，不存明文
- 支持撤销/过期
- 对 `GET /viewer/:token` 做基础限流（按 IP/UA）
- 记录 `lastAccessAt/accessCount` 便于审计与排查传播

### 5.3 数据隔离保证方式

- Viewer 的所有查询都必须由 `viewerLink -> projectId` 推导
- 禁止 Viewer 侧传 `projectId` 作为任意查询条件（避免越权）
- selection 写入也必须由 token 推导 `projectId/linkId`

---

## 6. 与“客户账号密码登录”的共存方式

### 方式 A（推荐）：不要求客户登录，直接用 token

- 客户体验最好：点链接即进
- 未来接入客户登录时，可在 Viewer 内增加“绑定账号/登录后进入我的选片台”

### 方式 B：链接仅用于定位项目，进入后要求客户账号密码确认

- 链接泄露风险更小（进入后仍需登录）
- 体验较差，且需要先做客户账号体系与找回密码流程

短期要快：推荐方式 A。

---

## 7. 最小落地清单（P0）

- 后端：ViewerLink 数据模型（`tokenHash/projectId/expiresAt/revokedAt`）
- 后端：生成/撤销/重置链接（Admin 侧 RBAC）
- 后端：`GET /viewer/:token` + token 校验（Viewer 公开入口）
- Viewer 前端：`/client/selection/[token]` 页面骨架（瀑布流/大图基础）
- 后端：selection 草稿 `PUT` + 提交 `POST`（提交后锁定）
