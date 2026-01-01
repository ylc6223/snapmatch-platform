# 摄影小程序管理后台 PRD 拆解与前后端任务分配（含 TODO）

基于：`docs/admin/prd.md`（管理后台 + 客户 PC 选片端）。

## 0. 文档目的

- 将 PRD 按“模块/流程/数据/接口”拆解为可开发的任务单
- 明确前端（Admin Web / Client Viewer）与后端（API / 存储 / 异步处理）职责边界
- 输出可迭代的开发 TODO List（按 P0/P1/P2 分级）

---

## 1. 范围与关键假设

### 1.1 交付范围（本 PRD 覆盖）

- **内部管理后台（Admin）**：工作台、作品集管理、交付与选片管理、客户与订单、系统设置（RBAC）
- **客户 PC 选片端（Client Viewer）**：独立访问入口，沉浸式选片、对比、提交、加片引导

### 1.2 假设与约束（落地时需要明确）

- 技术栈：仓库已有 `apps/admin`（Next.js）、`apps/backend`（NestJS），建议继续沿用 BFF 方案（Admin 的 `/api/*` 转发后端）。
- 存储：照片大文件，必须走对象存储直传（STS/签名 URL），避免经由 Web 服务器中转。
- 资源处理：水印/缩略图/预览图建议异步处理（队列/Worker），前端只关注“上传进度 + 处理状态”。
- 客户访问：强烈建议按 PRD 建议做独立 `viewer` 视图（`/client/selection/{uuid}`），不让客户进入真实 Admin。

### 1.3 非目标（本轮不做或后置）

- P2 中的数据大屏/绩效统计：后置
- “禁用右键保存”只能做弱防护（前端行为层），真正防盗链依赖存储策略/签名 URL

---

## 2. 角色与权限边界（RBAC）

为减少前后端不一致带来的成本，本仓库以 **role code** 为准统一命名为：

- `admin`：超级管理员（老板/系统拥有者）
- `photographer`：摄影师/修图师（内部员工，负责项目交付与照片处理）
- `sales`：销售/客服（内部员工，负责客户与订单跟进）
- `customer`：客户（外部用户；PC 选片端受限视图）

### 2.1 权限边界（建议落地规则）

- **服务端强校验（必须）**：所有写操作与敏感读操作（项目/照片/订单）都必须在后端做 RBAC 校验。
- **前端权限仅做可见性/交互提示**：菜单、按钮展示与禁用态；不可替代后端授权。
- **数据隔离（客户）**：客户只能通过 `viewerToken/uuid` 或与其身份绑定的方式访问自己的项目，不允许通过 ID 枚举越权。

### 2.2 典型资源与权限点（可作为权限字典草案）

- `projects:read / projects:write`
- `photos:upload / photos:read / photos:downloadOriginal`
- `selections:read / selections:submit / selections:lock`
- `orders:read / orders:write`
- `settings:write`

---

## 3. 功能模块拆解（含前后端分工）

下面每个模块按：前端（Admin/Viewer）、后端（API/处理/存储）拆分责任。

### 3.1 登录与鉴权

**前端（Admin）**

- 登录页：账号密码登录（员工）
- 登录态维护：获取 `me`（roles/permissions），路由保护（未登录跳转）
- 401/403 统一处理：过期/无权限提示与重登

**前端（Client Viewer）**

- 登录形态：仅保留“选片链接直达（访问令牌）”模式
- 不做：手机号验证码/扫码等客户登录（需求砍掉）

**后端**

- 员工登录：账号/密码 → JWT（或 Session）签发
- `me` 接口：返回用户 + roles/permissions + 绑定关系（员工所属门店/客户归属）

### 3.2 管理后台骨架（信息架构/导航/权限菜单）

**前端（Admin）**

- 布局：Sidebar、Topbar、面包屑、全局搜索（可选）
- 菜单按权限过滤：不同角色看到的模块不同
- 公共组件：表格、筛选、分页、对话框、Toast、空态/错误态

**后端**

- 提供可选的“菜单能力/Feature Flag”接口（非必须，前端可静态配置）

### 3.3 工作台（Dashboard）

**前端（Admin）**

- 数据概览卡片：访问量/订单量/待办事项（P2 可简化）
- 快捷入口：创建项目、上传照片、生成选片链接

**后端**

- 聚合统计接口（可先返回空/Mock，P2 再补齐）
- 待办列表：待选片/待确认/待交付等（依赖项目状态机）

### 3.4 作品集管理（CMS：用于小程序展示）

**前端（Admin）**

- 作品 CRUD：多图/视频上传、富文本描述、标签、排序、上下架
- 分类/标签管理：类目（婚纱/写真…）、标签（风格/场景…）
- 轮播图配置：首页 banner 列表与排序

**后端**

- 作品/分类/标签/轮播图数据模型与 CRUD API
- 素材直传签名（图片/视频），元数据入库
- 小程序只读聚合接口（缓存/版本号/updatedAt）

### 3.5 交付与选片管理（核心业务）

#### 3.5.1 项目创建与配置

**前端（Admin）**

- 项目列表/详情：创建项目（关联客户）、编辑项目参数
- 权限配置项：是否允许下载原图、水印开关、选片截止日期、套餐（精修 X、底片全送）
- 指派人员：摄影师/修图师/销售（用于数据隔离与协作）

**后端**

- 项目模型（Project）与状态机（Status）
- 项目权限字段校验与默认值
- 指派关系与查询过滤（`photographer/sales` 仅能看到自己被指派的项目，或按数据范围策略过滤）

#### 3.5.2 照片上传、处理与分组

**前端（Admin）**

- 批量上传：拖拽、分组（子相册）、断点续传/重试、上传进度
- 照片库管理：分组/排序/筛选（原片/预览/精修）、批量操作（标记、移动分组）
- 处理状态可视化：生成中/可预览/失败重试

**后端**

- 直传能力：`POST /assets/sign`（STS/签名 URL）
- 元数据入库：上传完成回调/确认接口（防止伪造）
- 异步处理：
  - 生成缩略图（列表）
  - 生成预览图（选片用，强制水印）
  - 原图加密/私有读（下载需鉴权 + 临时 URL）
- 分组（Album）与照片（Photo）关联结构

#### 3.5.3 选片进度监控与通知

**前端（Admin）**

- 项目状态流转可视化：待选片 → 选片中 → 已提交 → 修图中 → 待确认 → 已交付
- 选片统计：已选张数/套餐含量/超额张数
- 通知中心/提示：客户提交/修图上传完成等

**后端**

- 状态机与变更记录（AuditLog）
- 通知触发器：
  - 客户提交选片 → 通知摄影师/修图师
  - 精修上传完成 → 通知客户
- 通知通道：小程序订阅消息/短信/邮件（按实际接入选择）

### 3.6 客户 PC 选片端（Client Viewer）

**前端（Viewer）**

- 入口：`/client/selection/{uuid}`（或独立域名）
- 浏览模式：
  - 瀑布流
  - 大图模式（键盘方向键切换、空格“喜欢”）
  - 对比模式（两张并排）
- 选片标记：喜欢/入册/精修（根据套餐策略限制）
- 计数与加片引导：`X/Y`，超出提示与加购引导
- 提交确认：确认后锁定（不可再改），展示提交成功与下一步
- 基础防护：弱禁用右键/水印展示/不暴露原图 URL

**后端**

- 分享链接与访问控制：
  - 生成 `viewerToken/uuid` 绑定 `projectId`（可设置过期/一次性/可撤销）
  - 访问时校验 token，返回可见照片列表（仅预览图）
- 选片数据结构：
  - 草稿态（实时保存/可回滚）
  - 提交态（锁定）
- 加购订单：生成加片订单（二维码/支付链接），与项目绑定

### 3.7 订单与财务

**前端（Admin）**

- 订单列表：状态、金额、来源（小程序/加片/线下）
- 线下录入：手动录入收款、修改状态、备注
- 二销明细：加片费/相册制作费等（与项目关联）

**后端**

- 订单模型与状态流转
- 小程序支付订单同步（来源与数据结构需要对齐现有小程序/支付实现）
- 加片订单生成与支付回调（如有）

### 3.8 系统设置（权限配置/水印/小程序配置）

**前端（Admin）**

- 角色管理：预设 + 自定义（P1）
- 账号管理：员工创建、分配角色、重置密码（P1）
- 水印设置：Logo 上传、透明度、位置策略（九宫格/铺满）

**后端**

- 角色/权限 CRUD（P1）
- 水印配置保存与下发（处理服务读取配置生成水印）
- 存储配置/回调地址等（如需要）

---

## 4. 核心业务流程（端到端）

### 4.1 项目交付主流程（P0）

1. Admin 创建项目（绑定客户、套餐、权限项）
2. 摄影师上传原片（直传）→ 后端异步生成预览图/缩略图
3. Admin 生成选片链接（viewerToken）
4. 客户在 PC Viewer 选片（实时保存草稿）→ 提交确认（锁定）
5. 后台状态更新为“客户已提交”，通知修图师

### 4.2 精修交付流程（P1）

1. 修图师上传精修图（与选片结果对齐）
2. 客户确认 → 状态到“已交付”

---

## 5. 数据建模建议（用于后端落库/接口）

> 以下为建议字段，便于后续建表/建集合；具体以仓库现有数据模型为准。

- `User`：`id, type(staff/customer), roles[], permissions[], phone, wxOpenId?, status`
- `Project`：`id, name, shootDate, clientId, packageId, allowDownloadOriginal, watermarkEnabled, selectionDeadline, status, assignedStaffIds[]`
- `Album`：`id, projectId, name, sort`
- `Photo`：`id, projectId, albumId, filename, size, exif?, status(processing/ready/failed), variants{thumbUrl, previewUrl, originalKey, retouchedUrl?}`
- `Selection`：`id, projectId, clientId, status(draft/submitted/locked), items[{photoId, flags{liked,inAlbum,retouch}}], submittedAt`
- `ViewerLink`：`id, projectId, token, expiresAt, revokedAt`
- `Order`：`id, projectId, type(package/extra/album/offline), amount, status, channel, externalTradeNo?, createdBy`
- `WatermarkConfig`：`id, logoAssetId, opacity, positionMode(grid/tile), updatedAt`
- `AuditLog`：`id, actorId, action, resourceType, resourceId, before?, after?, createdAt`

---

## 6. 接口与前后端契约（建议清单）

### 6.1 认证

- `POST /auth/login`（员工）
- `GET /auth/me`
- `POST /auth/logout`

### 6.2 项目与照片

- `GET /projects`（按角色过滤）
- `POST /projects`
- `PATCH /projects/:id`
- `POST /projects/:id/viewer-link`（生成/刷新）
- `POST /assets/sign`（直传签名/STS）
- `POST /photos/confirm`（上传完成确认 + 元数据入库）
- `GET /projects/:id/photos`（分组/分页）

### 6.3 Viewer 选片

- `GET /viewer/:token`（拉取项目信息 + 预览图列表 + 套餐规则）
- `PUT /viewer/:token/selection`（草稿保存，幂等）
- `POST /viewer/:token/submit`（提交并锁定）

### 6.4 订单

- `GET /orders`
- `POST /orders/offline`（线下录入）
- `POST /projects/:id/extras/order`（加片订单生成，P1）

---

## 7. 开发任务 TODO List（按优先级）

> 约定：`[FE-Admin]`=管理后台前端，`[FE-Viewer]`=客户选片前端，`[BE]`=后端与处理服务。

### P0（必须有）

- [ ] [BE] 定义 Project/Album/Photo/Selection/ViewerLink 最小数据模型与迁移/初始化
- [ ] [BE] 员工登录打通：`/auth/login`、`/auth/me`、RBAC Guard（最小可用）
- [ ] [FE-Admin] 登录页接入真实登录（cookie/session/JWT 方案与现有后端对齐）
- [ ] [FE-Admin] 路由保护与全局 401/403 处理（中间件或布局层保护）
- [ ] [BE] 直传签名/STS：`/assets/sign` + 上传完成确认 `photos/confirm`
- [ ] [BE] 异步处理 MVP：生成缩略图 + 预览图（带水印），并回写 Photo 状态
- [ ] [FE-Admin] 项目创建：表单 + 列表/详情（含套餐张数、下载/水印/截止日期）
- [ ] [FE-Admin] 照片批量上传：拖拽、分组选择、进度/失败重试、状态刷新
- [ ] [BE] ViewerLink 生成与校验：`/projects/:id/viewer-link`、`GET /viewer/:token`
- [ ] [FE-Viewer] Viewer 基础：瀑布流/大图切换、键盘操作、喜欢标记
- [ ] [BE] 选片草稿保存 + 提交锁定：`PUT /viewer/:token/selection`、`POST /viewer/:token/submit`
- [ ] [FE-Viewer] 提交确认流程：锁定后不可修改 + 成功页/提示
- [ ] [BE] 状态机 P0：项目状态至少覆盖「待选片/选片中/已提交」
- [ ] [FE-Admin] 选片进度监控：展示 `X/Y` + “已提交”状态与时间

### P1（应该有）

- [ ] [BE] 多角色完善：`photographer/sales` 的资源过滤与权限点（细粒度 permissions）
- [ ] [FE-Admin] 菜单/按钮级权限控制（基于 `me.permissions`）
- [ ] [BE] 通知：客户提交选片 → 通知摄影师/修图师（消息通道按实际选型）
- [ ] [FE-Admin] 修图交付：精修图上传、与选片结果对齐、客户确认入口
- [ ] [FE-Viewer] 对比模式：两张并排 + 快速切换
- [ ] [BE] 加片订单：超额计算规则、订单生成与支付对接
- [ ] [FE-Viewer] 加片引导：超额提示、生成二维码/支付链接展示
- [ ] [FE-Admin] 订单列表 + 线下录入基础表单
- [ ] [BE] 订单同步（小程序支付订单）与状态流转
- [ ] [BE] ViewerLink 可撤销/过期策略 + 后台可管理（重置链接）

### P2（可以有）

- [ ] [FE-Admin] 数据大屏：本月拍摄量/选片率/收入等
- [ ] [BE] 统计聚合与缓存（按月/按摄影师）
- [ ] [FE-Admin] 修图师绩效统计

---

## 8. 里程碑建议（用于迭代排期）

- Milestone 1（P0 骨架）：登录 + 项目创建 + 上传 + Viewer 基础选片 + 提交锁定
- Milestone 2（交付闭环）：精修上传 + 客户确认 + 通知 + 基础订单
- Milestone 3（运营与增长）：CMS 完整化 + 加片支付 + 数据看板

---

## 9. 风险与预研清单（建议先做决策）

- 断点续传方案：对象存储的分片上传能力/SDK 选型与失败重试策略
- 水印与多规格图：异步处理的执行位置（后端 worker / 云函数 / CloudRun）与成本评估
- Viewer 安全：token 设计（长度/签名/过期/撤销）、防枚举、防盗链策略
- 客户访问形态：仅“选片链接直达”（不做短信/扫码登录与“我的选片台”登录态）
