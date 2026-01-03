# 第四阶段：前端开发（管理后台）

> **学习目标**：完成管理后台开发（apps/admin）  
> **预计时长**：10-12 小时  
> **难度等级**：⭐⭐⭐⭐☆

## 本阶段内容

### 1. [项目初始化](./01-project-initialization.md)

**大纲**：

- Next.js 项目创建
- TypeScript 配置
- TailwindCSS 集成
- shadcn/ui 组件库安装
  - 组件安装
  - 主题配置
- 目录结构规划
- ESLint 和 Prettier 配置

**实践任务**：搭建 Next.js 基础项目

---

### 2. [布局系统设计](./02-layout-system.md)

**大纲**：

- 响应式布局原理
- 侧边栏导航实现
- 顶部栏设计
  - 面包屑
  - 用户菜单
- 内容区域布局
- 移动端适配
- 主题切换（暗色模式）

**实践任务**：实现管理后台布局框架

---

### 3. [认证集成](./03-auth-integration.md)

**大纲**：

- 登录页面设计
- Token 管理
  - localStorage 封装
  - Token 刷新机制
- 路由守卫实现
  - Protected Route
  - 权限路由
- Context/Provider 设计
- 登出逻辑

**实践任务**：实现完整的认证流程

---

### 4. [用户管理界面](./04-user-management-ui.md)

**大纲**：

- 用户列表页面
  - 表格组件（shadcn/ui）
  - 分页组件
  - 搜索与筛选
- 用户表单
  - 创建用户表单
  - 编辑用户表单
  - 表单验证（react-hook-form）
- 状态管理（React Query）
  - 数据获取
  - 缓存策略
  - 乐观更新

**实践任务**：实现用户 CRUD 界面

---

### 5. [权限管理界面](./05-permission-management.md)

**大纲**：

- 角色列表与表单
- 权限树组件
- 角色权限配置
- 批量操作
- 权限验证 UI

**实践任务**：实现角色权限管理

---

### 6. [文件上传组件](./06-file-upload-component.md)

**大纲**：

- 上传组件设计
  - 拖拽上传
  - 进度显示
  - 错误处理
- 分片上传实现
  - 文件切片
  - 并发控制
  - 断点续传
- 图片预览
- 上传队列管理

**实践任务**：实现大文件上传组件

---

### 7. [状态管理](./07-state-management.md)

**大纲**：

- React Query 数据管理
  - Query 管理器
  - Mutation 管理器
  - 缓存策略
- Zustand 状态管理
  - Store 定义
  - Actions 实现
- Context API 使用场景
- 状态持久化

**学习成果**：掌握复杂状态管理

---

### 8. [通用组件库](./08-ui-components.md)

**大纲**：

- 组件设计原则
- 基于 shadcn/ui 扩展
- 常用组件封装
  - 数据表格
  - 表单组件
  - 对话框
  - 通知提示
- 组件文档编写
- Storybook 集成（可选）

**实践任务**：封装 3-5 个通用组件

---

### 9. [响应式设计](./09-responsive-design.md)

**大纲**：

- TailwindCSS 断点系统
- 移动端适配策略
  - 触摸优化
  - 滑动手势
- 平板适配
- 性能优化
  - 图片懒加载
  - 代码分割
  - SSR/SSG 优化

**实践任务**：优化移动端体验

---

## 🎯 阶段性目标

完成本阶段后，你将拥有：

- ✅ 功能完整的管理后台
- ✅ 美观的用户界面
- ✅ 良好的用户体验
- ✅ 可复用的组件库

## 📚 延伸阅读

- [Next.js 文档](https://nextjs.org/docs)
- [React Query 文档](https://tanstack.com/query/latest)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com/)

## ⏭️ 下一阶段

完成本阶段后，进入[第五阶段：部署上线](../06-deployment/README.md)

---

**返回目录**：[教程首页](../README.md)
