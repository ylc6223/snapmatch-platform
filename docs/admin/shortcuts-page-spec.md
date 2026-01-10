# 快捷入口页面技术规范

> **文档版本**: v1.0
> **创建日期**: 2026-01-10
> **页面路径**: `/admin/dashboard/shortcuts`
> **对应 PRD 章节**: 4.1

---

## 📊 目录

- [功能概述](#功能概述)
- [核心功能需求](#核心功能需求)
- [技术实现方案](#技术实现方案)
- [API 接口设计](#api-接口设计)
- [UI/UX 规范](#uiux-规范)
- [性能优化策略](#性能优化策略)
- [测试验收标准](#测试验收标准)

---

## 功能概述

**功能定位**: 作为管理后台的首页，为摄影师/管理员提供最常用的功能快速访问入口，提升日常工作效率。

**核心价值**:

- ⚡ **效率提升**: 减少导航层级，高频功能一步到位
- 👁️ **状态可视**: 轮播 + 网格双重视图，项目状态一目了然
- 🔍 **快速响应**: 搜索 + 筛选组合，秒级定位目标项目
- 🎯 **工作流优化**: 从"查看状态"到"处理任务"的路径最短化

---

## 核心功能需求

### 1. 顶部导航栏 (Navbar)

#### 1.1 全局搜索

**搜索范围**:

- ✅ 项目名称
- ✅ 客户姓名
- ❌ 照片文件名（暂不实现）

**技术实现**:

- **防抖策略**: 输入停止后 300ms 触发搜索
- **搜索接口**: `GET /admin/api/projects?q={keyword}`
- **实时建议**: 输入时展示匹配结果下拉列表
- **键盘导航**: 支持上下键选择，回车键确认

**搜索结果卡片**:

```typescript
{
  id: string;
  name: string; // 项目名称
  customerName: string; // 客户姓名
  status: ProjectStatus; // 项目状态
}
```

**交互行为**:

- 点击搜索结果 → Toast 提示 + "查看项目"按钮 → 跳转项目详情页
- ESC 键关闭搜索下拉
- 点击外部区域关闭搜索下拉

#### 1.2 新建项目按钮

**位置**: 导航栏右侧
**样式**: 主色调按钮，带有 Plus 图标
**功能**: 快速创建新项目
**跳转**: `/admin/dashboard/projects/new` (TODO: 项目创建页面路径)

---

### 2. 精选项目轮播 (FeaturedProjects)

#### 2.1 精选算法

**排序规则**: 按 `updatedAt` 最后更新时间倒序，取前 4 个项目

**未来优化方向** (暂不实现):

- 展示最近 7 天内活跃的项目
- 优先展示状态为"选片中"、"修图中"的项目
- 支持管理员手动标记"星标项目"

#### 2.2 轮播行为

**自动播放**: ❌ 不自动播放，用户手动控制
**理由**: 工作台页面应避免干扰，手动控制更符合工作场景

**交互功能**:

- 左右箭头切换
- 循环播放: `loop: true`
- 鼠标悬停暂停自动播放（预留，当前无自动播放）

#### 2.3 卡片信息展示

**必需字段**:

- 项目封面: 16:9 比例图片
- 项目标签: 显示项目类型/描述 (`description` 字段)
- 状态标签: 显示项目当前状态
- 项目名称: 大标题展示
- 照片数量: 显示 `photoCount`

**交互行为**:

- 鼠标悬停: 图片缩放 + 遮罩层加深
- 点击卡片: 跳转到项目详情页

---

### 3. 筛选与工具栏 (FilterBar)

#### 3.1 状态筛选标签

**筛选选项**:

| 筛选项 | 包含的项目状态                                                  | 说明           |
| ------ | --------------------------------------------------------------- | -------------- |
| 全部   | 所有状态                                                        | 显示所有项目   |
| 进行中 | PENDING, SELECTING, SUBMITTED, RETOUCHING, PENDING_CONFIRMATION | 尚未完成的项目 |
| 选片中 | SELECTING                                                       | 客户正在选片   |
| 修图中 | RETOUCHING                                                      | 修图师正在处理 |
| 已交付 | DELIVERED                                                       | 项目已完成     |

**UI 交互**:

- 使用 Tabs 组件实现
- 激活状态: 底部 2px 下划线动画 (Framer Motion `layoutId`)
- 支持横向滚动 (移动端)

#### 3.2 排序功能

**实现优先级**: P1（需要实现）

**排序选项**:

- 最新创建: `createdAt DESC`
- 最早创建: `createdAt ASC`

**实现方式**:

- 下拉菜单选择
- 前端对已加载的数据进行排序
- 每次筛选变更时重新应用排序

**未来扩展** (暂不实现):

- 按状态排序
- 按拍摄日期排序
- 按照片数量排序

#### 3.3 视图切换

**当前实现**: 网格视图
**未来扩展**: 列表视图 + 批量操作

**列表视图需求** (P2 优先级):

**使用场景**: 批量管理项目

**核心功能**:

- 批量删除项目 (主要需求)
- 未来扩展: 批量修改状态、批量导出

**列表列设计**:

```typescript
{
  选择框: Checkbox;
  项目名称: string;
  客户姓名: string;
  状态: ProjectStatus;
  照片数量: number;
  最后更新: Date;
  操作: '查看' | '更多';
}
```

---

### 4. 项目网格展示 (ProjectGrid)

#### 4.1 卡片信息 (标准模式)

**必需字段**:

```typescript
{
  id: string;
  name: string; // 项目名称
  customerName: string; // 客户姓名
  status: ProjectStatus; // 项目状态
  photoCount: number; // 照片数量
  createdAt: Date; // 创建日期 / 拍摄日期
  coverImageUrl: string; // 项目封面图
}
```

#### 4.2 响应式布局

**断点策略**: 768px (平板横屏及以上使用桌面布局)

**网格列数**:

```css
grid-cols-1      /* 移动端 (< 768px): 1列 */
sm:grid-cols-2   /* 小屏 (≥ 640px): 2列 */
lg:grid-cols-3   /* 中屏 (≥ 1024px): 3列 */
xl:grid-cols-4   /* 大屏 (≥ 1280px): 4列 */
```

#### 4.3 状态处理

**加载状态**:

- 首次加载: 显示卡片骨架屏 (Skeleton)
- 骨架屏数量: 8 个（占位）

**错误状态**:

- 显示错误信息
- 提供"重试"按钮 (触发重新请求)

**空状态**:

- 显示"暂无项目"文字
- 不提供引导按钮（保持简洁）

#### 4.4 点击行为

**跳转目标**: 项目详情页
**路由**: `/admin/dashboard/projects/{id}` (TODO: 项目详情页路径)

---

### 5. 数据更新策略

**更新方式**: 手动刷新

**实现**:

- 提供刷新按钮（可选）
- 用户手动刷新页面时重新加载数据
- 不使用轮询或 WebSocket

**理由**: 避免不必要的复杂度，工作台不需要实时性

---

## 技术实现方案

### 1. 前端技术栈

```typescript
// 核心依赖
{
  "next": "15.x",           // App Router
  "react": "19.x",          // Client Components
  "framer-motion": "12.x",  // 动画效果
  "sonner": "2.x",          // Toast 通知
  "@radix-ui/react-tabs": "1.x",  // Tabs 组件
}
```

### 2. 组件架构

```
shortcuts/
├── page.tsx                          // 页面入口
├── components/
│   ├── navbar.tsx                    // 顶部导航栏
│   │   └── search-input.tsx          // 搜索输入组件
│   ├── featured-projects.tsx         // 精选项目轮播
│   ├── filter-bar.tsx                // 筛选工具栏
│   ├── project-grid.tsx              // 项目网格
│   ├── project-card.tsx              // 项目卡片
│   └── project-list.tsx             // 项目列表 (TODO)
└── hooks/
    ├── use-projects.ts               // 项目数据管理
    ├── use-search.ts                 // 搜索逻辑
    └── use-debounce.ts               // 防抖 Hook
```

### 3. 状态管理

**使用 React Query (TanStack Query)**:

```typescript
// hooks/use-projects.ts
export function useProjects(filter?: string) {
  return useQuery({
    queryKey: ['projects', filter],
    queryFn: () => fetchProjects(filter),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
  });
}
```

**本地状态** (React useState):

- 激活的筛选条件: `activeFilter`
- 排序方式: `sortBy`
- 视图模式: `viewMode` ('grid' | 'table')
- 搜索关键词: `searchQuery`

### 4. 搜索实现

**防抖 Hook**:

```typescript
// hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**搜索组件**:

```typescript
// components/search-input.tsx
export function SearchInput({ onSelect }: { onSelect: (item: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchProjects(debouncedQuery).then(setResults);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // ... 键盘导航和下拉列表渲染
}
```

---

## API 接口设计

### 1. 获取项目列表

**接口**: `GET /admin/api/projects`

**查询参数**:

```typescript
{
  q?: string;           // 搜索关键词（项目名称或客户姓名）
  status?: ProjectStatus;  // 状态筛选
  sortBy?: 'createdAt' | '-createdAt' | 'updatedAt' | '-updatedAt';
  page?: number;        // 页码（暂不实现分页）
  limit?: number;       // 每页数量（暂不实现分页）
}
```

**响应格式**:

```typescript
{
  code: 200;
  message: "success";
  data: Project[];
  timestamp: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  customerId: string;
  customerName: string;  // 关联查询
  status: ProjectStatus;
  photoCount: number;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  shootDate?: string;
}
```

### 2. 批量删除项目

**接口**: `DELETE /admin/api/projects/batch`

**请求体**:

```typescript
{
  ids: string[];  // 项目 ID 数组
}
```

**响应**:

```typescript
{
  code: 200;
  message: '删除成功';
  data: {
    deletedCount: number;
  }
  timestamp: number;
}
```

---

## UI/UX 规范

### 1. 视觉设计

**卡片间距**: `gap-6` (24px)
**圆角**: `rounded-lg` (8px)
**阴影**: `shadow-md`
**悬停效果**: `hover:shadow-lg`

**颜色规范**:

```css
--primary: hsl(var(--primary)); /* 主色调 */
--foreground: hsl(var(--foreground)); /* 前景色 */
--muted-foreground: hsl(var(--muted-foreground)); /* 次要前景色 */
--border: hsl(var(--border)); /* 边框色 */
--background: hsl(var(--background)); /* 背景色 */
```

**状态标签颜色**:

- PENDING (待选片): 灰色
- SELECTING (选片中): 蓝色
- RETOUCHING (修图中): 紫色
- DELIVERED (已交付): 绿色

### 2. 动画规范

**Tab 切换动画**:

```typescript
<motion.div
  layoutId="activeTab"
  className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
/>
```

**卡片悬停动画**:

```css
transition: transform 0.7s ease-out;
group-hover: scale-105;
```

**骨架屏动画**:

```css
@keyframes skeleton {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

animate-pulse {
  animation: skeleton 1.5s ease-in-out infinite;
}
```

### 3. 可访问性

**键盘导航**:

- `Tab`: 焦点移动
- `Enter`: 确认选择
- `Escape`: 关闭下拉/弹窗
- `Arrow Up/Down`: 搜索结果导航

**ARIA 标签**:

```tsx
<button aria-label="新建项目" />
<div role="tabpanel" aria-selected={isActive} />
<img alt={`${project.name} 项目封面`} />
```

**焦点管理**:

- 搜索框获得焦点时显示下拉
- 点击外部区域时失去焦点
- 模态框打开时焦点 trap

---

## 性能优化策略

### 1. 图片优化

**格式**: WebP (优先), JPEG (回退)
**尺寸**:

- 封面图: 800x450 (16:9)
- 缩略图: 400x225 (懒加载)

**懒加载**:

```tsx
<img loading="lazy" src={project.coverImageUrl} alt={project.name} />
```

### 2. 数据缓存

**React Query 缓存策略**:

```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 分钟内使用缓存
  gcTime: 10 * 60 * 1000,    // 10 分钟后垃圾回收
}
```

### 3. 虚拟滚动 (可选)

**触发条件**: 项目数量 > 100

**实现方案**:

- 使用 `@tanstack/react-virtual`
- 或使用 `react-window` (更轻量)

### 4. 防抖优化

**搜索防抖**: 300ms
**窗口 resize 防抖**: 200ms

---

## 测试验收标准

### 1. 功能测试

**搜索功能**:

- [ ] 输入 2 个字符后触发搜索
- [ ] 搜索结果包含匹配的项目和客户
- [ ] 点击搜索结果跳转到项目详情页
- [ ] ESC 键关闭搜索下拉
- [ ] 清空搜索框后恢复显示所有项目

**筛选功能**:

- [ ] 点击"选片中"只显示状态为 SELECTING 的项目
- [ ] 点击"全部"显示所有项目
- [ ] 筛选状态下显示正确结果数量
- [ ] 筛选后排序功能正常工作

**排序功能**:

- [ ] 选择"最新创建"按创建时间倒序排列
- [ ] 选择"最早创建"按创建时间正序排列
- [ ] 排序后卡片顺序正确

**批量操作**:

- [ ] 可以选择多个项目
- [ ] 批量删除前显示二次确认弹窗
- [ ] 删除成功后更新列表
- [ ] 删除失败显示错误提示

### 2. UI/UX 测试

**响应式布局**:

- [ ] 移动端 (< 768px) 显示 1 列
- [ ] 小屏 (≥ 640px) 显示 2 列
- [ ] 中屏 (≥ 1024px) 显示 3 列
- [ ] 大屏 (≥ 1280px) 显示 4 列

**骨架屏**:

- [ ] 首次加载显示骨架屏
- [ ] 骨架屏数量为 8 个
- [ ] 加载完成后骨架屏消失
- [ ] 骨架屏布局与实际卡片一致

**空状态**:

- [ ] 没有项目时显示"暂无项目"
- [ ] 筛选结果为空时显示"暂无项目"
- [ ] 错误状态显示错误信息和"重试"按钮

### 3. 性能测试

**加载时间**:

- [ ] 首屏加载时间 < 2s (4G 网络)
- [ ] 搜索响应时间 < 500ms (输入停止后)
- [ ] 筛选响应时间 < 100ms (前端过滤)

**内存占用**:

- [ ] 滚动 100 个项目无卡顿
- [ ] 搜索结果下拉流畅无卡顿

### 4. 兼容性测试

**浏览器**:

- [ ] Chrome (最新版)
- [ ] Safari (最新版)
- [ ] Firefox (最新版)
- [ ] Edge (最新版)

**设备**:

- [ ] 桌面 (1920x1080)
- [ ] 笔记本 (1366x768)
- [ ] 平板横屏 (768px+)
- [ ] 平板竖屏 (< 768px)
- [ ] 手机 (375px)

---

## 实施优先级

### P0 (必须有)

- [x] 顶部导航栏 (搜索 + 新建项目按钮)
- [x] 精选项目轮播 (按最后更新时间排序)
- [x] 状态筛选标签 (全部、进行中、选片中、修图中、已交付)
- [x] 项目网格展示 (标准模式)
- [x] 响应式布局 (768px 断点)
- [x] 骨架屏加载
- [x] 手动刷新功能

### P1 (应该有)

- [ ] 防抖搜索 (后端接口)
- [ ] 基础日期排序 (最新/最早创建)
- [ ] 项目卡片点击跳转详情页
- [ ] 错误状态处理 + 重试按钮

### P2 (可以有)

- [ ] 列表视图 + 批量删除
- [ ] 高级搜索 (按状态、客户筛选)
- [ ] 虚拟滚动 (项目数量 > 100)

---

## 未来优化方向

1. **智能推荐算法**
   - 综合打分（最近更新 + 状态权重 + 互动频率）
   - 机器学习推荐用户最关心的项目

2. **实时协作**
   - WebSocket 实时推送项目状态变更
   - 多用户同时编辑时的冲突处理

3. **个性化配置**
   - 用户自定义筛选条件
   - 用户自定义卡片显示字段
   - 用户自定义默认排序方式

4. **数据可视化**
   - 项目状态分布饼图
   - 选片进度趋势图
   - 工作量统计图表

---

**文档状态**: ✅ 已完成
**最后更新**: 2026-01-10
**维护者**: 开发团队
