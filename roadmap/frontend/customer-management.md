# 客户管理模块优化路线图

> **模块**: 客户与订单 - 客户档案管理
> **状态**: ✅ 基础功能已完成 | 🚧 优化进行中
> **优先级**: P1 - 高优先级
> **负责人**: 开发团队
> **最后更新**: 2026-01-10

---

## 📋 当前状态

### ✅ 已完成功能

- [x] 客户列表展示
- [x] 客户搜索（按姓名、手机号）
- [x] 客户分页
- [x] 客户排序
- [x] 列显示/隐藏控制
- [x] 新建客户
- [x] 编辑客户
- [x] 删除客户（带确认对话框）
- [x] 刷新数据
- [x] URL 状态同步
- [x] 响应式布局
- [x] 加载状态提示
- [x] Toast 消息提示
- [x] 服务端/客户端组件分离
- [x] 后端 CRUD API
- [x] BFF 路由层

### 🚧 待优化功能

详见下方优化计划

---

## 🎯 优化计划

### 1. 添加手机号格式验证 ⭐⭐⭐

**优先级**: P0 - 最高
**复杂度**: 低
**预计工时**: 2-3 小时

**功能描述**:

- 客户表单添加手机号格式验证
- 支持中国大陆手机号格式（11位，1开头）
- 实时验证提示
- 提交时统一校验

**技术方案**:

```typescript
// 使用 Zod 进行表单验证
import { z } from 'zod';

const customerFormSchema = z.object({
  phone: z
    .string()
    .min(11, '手机号必须是11位')
    .max(11, '手机号必须是11位')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
});
```

**验收标准**:

- [ ] 输入时实时提示格式错误
- [ ] 提交时校验手机号格式
- [ ] 支持手机号唯一性校验
- [ ] 错误提示清晰友好

**文件位置**:

- `/apps/admin/components/customers/customer-form-dialog.tsx`

---

### 2. 添加更多筛选条件 ⭐⭐⭐

**优先级**: P1 - 高
**复杂度**: 中
**预计工时**: 4-6 小时

**功能描述**:

- 按标签筛选客户
- 按创建时间范围筛选
- 按更新时间范围筛选
- 多条件组合筛选
- 筛选条件持久化（保存到 URL）

**UI 设计**:

```
┌─────────────────────────────────────────────┐
│ 筛选条件                                     │
├─────────────────────────────────────────────┤
│ 标签: [多选下拉框]                           │
│ 创建时间: [开始日期] - [结束日期]            │
│ 更新时间: [开始日期] - [结束日期]            │
│                                              │
│ [清空筛选] [应用筛选]                        │
└─────────────────────────────────────────────┘
```

**技术方案**:

1. 添加筛选面板组件（可折叠）
2. URL 参数扩展：
   - `tags=VIP,老客户` (逗号分隔)
   - `createdAtStart=1234567890`
   - `createdAtEnd=1234567890`
3. 后端 API 扩展筛选参数

**验收标准**:

- [ ] 筛选面板可展开/收起
- [ ] 支持多标签选择
- [ ] 支持日期范围选择
- [ ] 筛选条件同步到 URL
- [ ] 清空筛选功能
- [ ] 筛选结果计数显示

**文件位置**:

- `/apps/admin/components/customers/customer-filter-panel.tsx` (新建)
- `/apps/admin/components/customers/customer-table.tsx` (修改)
- `/apps/backend/src/customers/dto/query-customers.dto.ts` (扩展)

---

### 3. 添加批量操作功能 ⭐⭐

**优先级**: P2 - 中
**复杂度**: 中
**预计工时**: 6-8 小时

**功能描述**:

- 批量选择客户（复选框）
- 批量删除
- 批量添加/移除标签
- 批量导出

**UI 设计**:

```
┌─────────────────────────────────────────────┐
│ ☑ 全选 (已选 5 项)                          │
│                                              │
│ [批量删除] [批量添加标签] [批量导出]         │
└─────────────────────────────────────────────┘
```

**技术方案**:

1. 表格添加复选框列
2. 批量操作工具栏（选中时显示）
3. 后端 API 支持批量操作：
   - `DELETE /api/customers/batch` (批量删除)
   - `PATCH /api/customers/batch` (批量更新)

**API 设计**:

```typescript
// 批量删除
DELETE /api/customers/batch
Body: { ids: string[] }

// 批量更新标签
PATCH /api/customers/batch
Body: {
  ids: string[],
  updates: {
    tags?: { action: "add" | "remove" | "set", values: string[] }
  }
}
```

**验收标准**:

- [ ] 支持全选/取消全选
- [ ] 显示已选数量
- [ ] 批量删除带二次确认
- [ ] 批量添加标签功能
- [ ] 批量导出功能
- [ ] 操作进度提示

**文件位置**:

- `/apps/admin/components/customers/customer-table.tsx` (扩展)
- `/apps/backend/src/customers/customers.controller.ts` (扩展)

---

### 4. 添加导出功能 ⭐⭐

**优先级**: P2 - 中
**复杂度**: 中
**预计工时**: 4-6 小时

**功能描述**:

- 导出当前筛选结果为 Excel
- 导出当前选中项为 Excel
- 支持自定义导出字段
- 支持导出格式：Excel (.xlsx), CSV

**技术方案**:

1. 使用 `xlsx` 库生成 Excel
2. 客户端导出（适合小数据量）
3. 服务端导出（适合大数据量，流式处理）

**依赖安装**:

```bash
npm install xlsx
npm install @types/xlsx -D
```

**实现示例**:

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (customers: Customer[]) => {
  const worksheet = XLSX.utils.json_to_sheet(customers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '客户数据');
  XLSX.writeFile(workbook, `客户数据_${Date.now()}.xlsx`);
};
```

**验收标准**:

- [ ] 导出当前页数据
- [ ] 导出所有筛选结果
- [ ] 导出选中项
- [ ] 选择导出字段
- [ ] 导出进度提示
- [ ] Excel 格式正确（中文不乱码）

**文件位置**:

- `/apps/admin/lib/utils/export.ts` (新建)
- `/apps/admin/components/customers/customer-table.tsx` (扩展)

---

### 5. 添加客户详情查看页面 ⭐⭐⭐

**优先级**: P1 - 高
**复杂度**: 中
**预计工时**: 6-8 小时

**功能描述**:

- 点击客户姓名跳转到详情页
- 展示客户完整信息
- 显示客户关联的项目列表
- 显示客户历史记录（可选）

**页面路由**:

```
/dashboard/crm/customers/[id]
```

**页面布局**:

```
┌─────────────────────────────────────────────┐
│ ← 返回          客户详情                     │
├─────────────────────────────────────────────┤
│ 基本信息                                    │
│ 姓名: 张三    手机号: 13800138000           │
│ 邮箱: zhangsan@example.com                 │
│ 标签: VIP, 老客户                          │
│ 备注: 重要客户，优先跟进                     │
├─────────────────────────────────────────────┤
│ 关联项目 (3)                                │
│ ┌─────────────────────────────────────┐   │
│ │ 婚纱照选片 - 2024-01-15 - 查看详情 → │   │
│ │ 个人写真 - 2024-03-20 - 查看详情 →   │   │
│ └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ 操作                                        │
│ [编辑信息] [查看项目] [添加备注]            │
└─────────────────────────────────────────────┘
```

**技术方案**:

1. 详情页面组件（服务端组件）
2. 获取客户详情 API
3. 获取客户项目列表 API
4. 使用 Tabs 切换不同信息区块

**API 设计**:

```typescript
// 获取客户详情（包含关联项目）
GET /api/customers/:id?includeProjects=true

Response: {
  customer: Customer;
  projects: Project[];
}
```

**验收标准**:

- [ ] 客户基本信息展示
- [ ] 关联项目列表展示
- [ ] 点击项目跳转到项目详情
- [ ] 快捷编辑按钮
- [ ] 响应式布局
- [ ] 加载状态

**文件位置**:

- `/apps/admin/app/dashboard/crm/customers/[id]/page.tsx` (新建)
- `/apps/admin/components/customers/customer-detail.tsx` (新建)
- `/apps/admin/app/api/customers/[id]/route.ts` (扩展)

---

## 📊 性能优化

### 6. 列表虚拟滚动 ⭐

**优先级**: P3 - 低
**复杂度**: 高
**预计工时**: 8-10 小时

**功能描述**:

- 当客户数量超过 1000 时启用虚拟滚动
- 只渲染可见区域的数据行
- 提升大量数据时的渲染性能

**技术方案**:

- 使用 `@tanstack/react-virtual` 或 `react-window`
- 替换现有的 DataTable 组件

**适用场景**:

- 客户数据量 > 1000 条

---

## 🔐 安全性增强

### 7. 操作日志记录 ⭐⭐

**优先级**: P2 - 中
**复杂度**: 中
**预计工时**: 4-6 小时

**功能描述**:

- 记录客户的创建、修改、删除操作
- 记录操作人、操作时间、操作内容
- 支持查看客户操作历史

**数据表设计**:

```sql
CREATE TABLE customer_logs (
  _id VARCHAR(34) PRIMARY KEY,
  customerId VARCHAR(34) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create/update/delete
  operatorId VARCHAR(34) NOT NULL,
  changes JSON, -- 变更详情
  createdAt BIGINT NOT NULL,
  INDEX idx_customerId (customerId),
  INDEX idx_action (action)
);
```

---

## 📝 开发注意事项

### 组件架构

- ✅ **服务端组件**: 页面 (`page.tsx`)
- ✅ **客户端组件**: 表格、表单、Dialog
- ✅ **数据获取**: 服务端初始数据 + 客户端交互更新

### 状态管理

- URL 参数同步：搜索、分页、排序、筛选
- 本地状态：Dialog 开关、表单数据

### 性能考虑

- 服务端渲染初始数据（SEO、首屏速度）
- 客户端组件按需加载
- 避免不必要的重渲染

---

## 🚀 开发顺序建议

1. **Phase 1** (高优先级 - 本周完成)
   - [ ] 手机号格式验证
   - [ ] 客户详情页面

2. **Phase 2** (中优先级 - 下周完成)
   - [ ] 更多筛选条件
   - [ ] 批量操作功能

3. **Phase 3** (低优先级 - 有时间再做)
   - [ ] 导出功能
   - [ ] 虚拟滚动
   - [ ] 操作日志

---

## 📚 相关文档

- [客户数据库设计](/docs/admin/sql-scripts-ready-to-run.md#2️⃣-创建客户表customers)
- [客户 API 文档](/docs/admin/api.md) (待补充)
- [组件开发规范](/docs/admin/component-guide.md) (待补充)

---

**文档维护者**: 开发团队
**最后审核**: 2026-01-10
