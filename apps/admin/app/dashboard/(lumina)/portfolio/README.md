# Portfolio模块架构说明

## 🎨 设计理念

Portfolio模块采用**lumina-lens设计风格**，提供现代化的作品管理体验。

**与Dashboard其他模块的区别：**

- ✅ **浮动Sidebar**：不占用布局空间，hover显示tooltip
- ✅ **无SiteHeader**：简化设计，FilterBar集成搜索和筛选
- ✅ **全屏内容**：沉浸式浏览体验

## 📁 文件结构

```
app/dashboard/
├── layout.tsx                          # Dashboard通用layout（shadcn Sidebar + SiteHeader）
├── (lumina)/                           # Route Group - 隔离lumina设计 ⭐
│   └── portfolio/                      # Portfolio模块（完全独立）
│       ├── layout.tsx                  # Portfolio专属layout（lumina设计）
│       ├── portfolio-sidebar-client.tsx # Sidebar客户端包装
│       ├── works/                      # 作品列表页
│       │   ├── page.tsx
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   └── components/
│   ├── page.tsx               # 作品列表页（lumina设计）
│   ├── types.ts               # 类型定义
│   ├── constants.ts           # Mock数据
│   └── components/
│       ├── Sidebar.tsx        # 浮动导航栏
│       ├── FilterBar.tsx      # 顶部筛选栏
│       ├── PhotoViews.tsx     # 网格/列表视图
│       ├── Toolbar.tsx        # 右下角操作按钮
│       ├── PhotoDrawer.tsx    # 编辑抽屉
│       └── index.ts
├── categories/
│   └── page.tsx               # 分类管理（保留原有设计）
└── banners/
    └── page.tsx               # 轮播图配置（保留原有设计）
```

## 🔑 关键：Route Group `(lumina)`

**为什么使用Route Group？**

在Next.js中，**所有layout都会嵌套渲染**。如果不使用route group：

```
❌ 错误：三层layout嵌套
app/layout.tsx (根layout)
  └── app/dashboard/layout.tsx (shadcn Sidebar + SiteHeader) ← 仍然渲染！
      └── app/dashboard/portfolio/layout.tsx (lumina layout)
```

使用route group后：

```
✅ 正确：portfolio独立layout
app/layout.tsx (根layout)
  ├── app/dashboard/layout.tsx (shadcn layout) ← 大部分dashboard页面
  └── app/dashboard/(lumina)/portfolio/layout.tsx (lumina layout) ← 完全独立
```

**URL保持不变：**

- Route group的括号 `(lumina)` 不会出现在URL中
- 访问 `/dashboard/portfolio/works` 会使用 `(lumina)/portfolio/layout.tsx`
- 访问 `/dashboard/analytics` 会使用 `dashboard/layout.tsx`

## 🏗️ 架构设计

### Portfolio专属Layout (`layout.tsx`)

**职责：**

1. **认证管理**：复用dashboard的认证逻辑
2. **Sidebar渲染**：提供lumina风格的浮动导航
3. **主题管理**：支持dark mode切换
4. **布局容器**：为内容区域预留Sidebar空间

**核心特点：**

```tsx
<div className="relative h-screen w-full">
  {/* 浮动Sidebar - fixed定位，不占空间 */}
  <Sidebar user={user} />

  {/* 内容区域 - pl-24为Sidebar留出空间 */}
  <main className="pl-0 md:pl-24">{children}</main>
</div>
```

### 导航系统

**Sidebar高亮逻辑：**

```tsx
const isActive = (href: string) => {
  if (href === "/dashboard/portfolio/works") {
    return pathname === href; // 精确匹配
  }
  return pathname?.startsWith(href); // 前缀匹配
};
```

**导航菜单：**

- 📸 **作品列表** → `/dashboard/portfolio/works`
- 📁 **分类管理** → `/dashboard/portfolio/categories`
- 🖼️ **轮播图配置** → `/dashboard/portfolio/banners`

## 🎯 页面设计策略

### Works页面（完全lumina风格）

**组件：**

- ✅ FilterBar（顶部浮动筛选栏）
- ✅ Toolbar（右下角FAB按钮）
- ✅ PhotoViews（网格/列表视图）
- ✅ PhotoDrawer（编辑抽屉）

**特点：**

- Masonry瀑布流布局
- Hover编辑操作
- 全屏图片预览

### Categories/Banners页面（混合设计）

**设计：**

- ✅ 保留原有的shadcn组件设计
- ✅ 自动获得lumina Sidebar导航
- ✅ 内容区域自动调整padding（pl-24）

**为什么不完全lumina化？**

1. **功能优先**：表格/表单页面不需要复杂的视觉设计
2. **渐进迁移**：先验证lumina设计的用户反馈
3. **灵活性**：不同页面可以使用最适合的设计风格

## 🔧 认证系统

**可复用认证函数** (`lib/layout/auth-layout.tsx`)：

```tsx
// Portfolio layout中使用
import { authenticateUser } from "@/lib/layout/auth-layout";

export default async function PortfolioLayout({ children }) {
  const user = await authenticateUser(); // 自动处理认证和重定向

  return (
    <div>
      <Sidebar user={user} />
      <main>{children}</main>
    </div>
  );
}
```

**认证流程：**

1. 检查access token
2. 调用`/api/v1/auth/me`获取用户信息
3. 401 → 重定向到session-expired
4. 403 → 重定向到forbidden
5. 成功 → 返回用户信息

## 🌓 主题管理

**实现方式：** 使用admin项目的`next-themes`系统

**关键组件：**

```tsx
import { useTheme } from "next-themes";
import { useThemeTransition } from "@/components/ui/theme-toggle-button";

const { resolvedTheme, setTheme } = useTheme();
const { startTransition } = useThemeTransition();
```

**主题切换：**

```tsx
const handleThemeToggle = () => {
  startTransition(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
};
```

**特性：**

- ✅ 支持View Transitions API动画
- ✅ 自动持久化到localStorage
- ✅ 响应系统主题偏好
- ✅ 与admin其他页面保持一致

**Sidebar上的主题切换按钮：**

- ☀️ → 切换到亮色模式
- 🌙 → 切换到暗色模式

## 📱 响应式设计

**桌面端（md+）：**

- Sidebar显示：`hidden md:flex`
- 内容区域padding：`pl-24`
- FilterBar完整显示

**移动端（< md）：**

- Sidebar隐藏：`hidden md:flex`
- 内容区域padding：`pl-0`
- FilterBar响应式展开

**注意：** 当前版本暂不考虑移动端导航优化（未来可添加底部TabBar）

## 🚀 扩展指南

### 添加新的Portfolio子页面

1. **创建页面文件**：

```bash
app/dashboard/portfolio/new-page/
└── page.tsx
```

2. **页面内容**：

```tsx
export default function NewPage() {
  return <main className="mx-auto max-w-[1800px] px-4 pt-32 pb-32 md:px-24">{/* 你的内容 */}</main>;
}
```

3. **更新Sidebar导航**（如果需要）：

```tsx
// components/Sidebar.tsx
const PORTFOLIO_NAV_ITEMS = [
  // ...existing items
  {
    href: "/dashboard/portfolio/new-page",
    label: "新页面",
    icon: <SomeIcon size={20} />
  }
];
```

### 将Categories页面也lumina化（可选）

1. **复用works组件**：

```tsx
// categories/page.tsx
import { FilterBar } from "../works/components/FilterBar";
import { Toolbar } from "../works/components/Toolbar";
```

2. **自定义内容区域**：

```tsx
<main>
  <FilterBar viewMode={viewMode} setViewMode={setViewMode} />
  {/* 你的分类管理内容 */}
</main>
```

## 🐛 已知限制

1. **移动端导航**：Sidebar在移动端隐藏，无替代方案
2. **Tab切换**：无多标签页功能（不同于dashboard其他页面）
3. **SiteHeader功能**：用户菜单集成在Sidebar底部

## 📊 性能优化

1. **认证复用**：避免重复的API调用
2. **CSS隔离**：layout层处理全局样式，页面层专注内容
3. **组件懒加载**：PhotoDrawer等按需渲染

## 🔗 相关文件

- `lib/layout/auth-layout.tsx` - 认证工具函数
- `lib/auth/session.ts` - Session管理
- `lib/routing/base-path.ts` - 路由工具
- `components/navigation/app-sidebar.tsx` - Dashboard的shadcn Sidebar（对比参考）
