# PRD Checklist（实现对照）

来源文档：`discuss/admin/prd-breakdown-and-todos.md`

状态说明：

- ✅ `- [x]`：已实现
- ⬜ `- [ ]`：未实现
- 🟨 `- [ ]`：部分实现（会在条目后标注原因）
- 🚫：需求已砍掉/不做（会在条目后标注）

---

## 3.1 登录与鉴权（摘取关键点）

- [x] [FE-Admin] 登录页：账号密码登录（员工）
- [x] [FE-Admin] 登录态维护：获取 `me`（roles/permissions），路由保护（未登录跳转）
- [x] [FE-Admin] 401/403 统一处理：过期/无权限提示与重登
- [ ] [FE-Viewer] 客户访问形态：选片链接直达（访问令牌）为主
- 🚫 [FE-Viewer/BE] 客户短信验证码/扫码登录：需求已砍掉（见原 PRD 3.1/6.1）

---

## 7. 开发任务 TODO List（按优先级）

### P0（必须有）

- [ ] [BE] 定义 Project/Album/Photo/Selection/ViewerLink 最小数据模型与迁移/初始化
- [x] [BE] 员工登录打通：`/auth/login`、`/auth/me`、RBAC Guard（最小可用）
- [x] [FE-Admin] 登录页接入真实登录（cookie/session/JWT 方案与现有后端对齐）
- [x] [FE-Admin] 路由保护与全局 401/403 处理（中间件或布局层保护）
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
- [ ] [FE-Admin] 菜单/按钮级权限控制（基于 `me.permissions`）🟨（当前已做侧边栏菜单过滤；按钮级/细粒度权限尚未系统性落地）
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
