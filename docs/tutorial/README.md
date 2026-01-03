# SnapMatch 项目完整开发教程

本教程系列将详细介绍 SnapMatch 管理系统从零到上线的完整开发流程，涵盖架构设计、环境搭建、功能实现到部署运维的全过程。

## 📚 教程概述

### 项目简介

SnapMatch 是一个摄影师作品管理与交付平台，包含以下核心功能：

- **用户管理**：基于 RBAC 的多角色权限控制
- **作品管理**：摄影师作品集展示与管理
- **照片交付**：客户选片与高清照片交付
- **文件上传**：支持大文件分片上传、断点续传

### 技术栈

- **后端**：NestJS + TypeScript + MySQL + TypeORM
- **前端**：Next.js + React + TailwindCSS + shadcn/ui
- **存储**：Cloudflare R2（S3 兼容 API）
- **认证**：JWT + Passport + RBAC
- **部署**：Docker + 云托管

## 🎯 学习路径

### 第一阶段：项目规划与架构设计

> **目标**：理解项目需求，完成技术选型和架构设计

**预计时长**：2-3 小时

- [需求分析](./01-project-planning/01-requirements-analysis.md) - 功能需求与非功能需求
- [技术栈选型](./01-project-planning/02-tech-stack-selection.md) - 为什么选择这些技术
- [架构设计](./01-project-planning/03-architecture-design.md) - 系统架构与模块划分
- [数据库设计](./01-project-planning/04-database-design.md) - ER 图与表结构设计
- [项目结构规划](./01-project-planning/05-project-structure.md) - Monorepo 与目录组织

### 第二阶段：环境搭建与配置

> **目标**：搭建本地开发环境，配置云服务

**预计时长**：3-4 小时

- [本地开发环境](./02-environment-setup/01-local-dev-environment.md) - Node.js、pnpm、MySQL
- [云服务配置](./02-environment-setup/02-cloud-services-setup.md) - CloudBase/R2 配置
- [开发工具配置](./02-environment-setup/03-development-tools.md) - VS Code、Git、ESLint
- [团队协作规范](./02-environment-setup/04-team-collaboration.md) - Git Flow 与 Code Review

### 第三阶段：后端开发

> **目标**：完成后端 API 开发（apps/backend）

**预计时长**：8-10 小时

- [项目初始化](./03-backend-development/01-project-initialization.md) - NestJS 项目搭建
- [认证模块](./03-backend-development/02-auth-module.md) - JWT 登录与会话管理
- [用户管理](./03-backend-development/03-user-management.md) - CRUD 与 RBAC
- [RBAC 权控](./03-backend-development/04-rbac-implementation.md) - 角色与权限实现
- [文件上传](./03-backend-development/05-file-upload-module.md) - R2 分片上传
- [API 设计](./03-backend-development/06-api-design.md) - RESTful 规范
- [测试策略](./03-backend-development/07-testing-strategy.md) - 单元测试与集成测试
- [API 文档](./03-backend-development/08-documentation.md) - Swagger 配置

### 第四阶段：前端开发（管理后台）

> **目标**：完成管理后台开发（apps/admin）

**预计时长**：10-12 小时

- [项目初始化](./04-frontend-admin/01-project-initialization.md) - Next.js 项目搭建
- [布局系统](./04-frontend-admin/02-layout-system.md) - 响应式布局与导航
- [认证集成](./04-frontend-admin/03-auth-integration.md) - 登录/登出与路由守卫
- [用户管理界面](./04-frontend-admin/04-user-management-ui.md) - 用户列表与表单
- [权限管理界面](./04-frontend-admin/05-permission-management.md) - 角色与权限配置
- [文件上传组件](./04-frontend-admin/06-file-upload-component.md) - 分片上传实现
- [状态管理](./04-frontend-admin/07-state-management.md) - React Query 与 Zustand
- [通用组件](./04-frontend-admin/08-ui-components.md) - 组件库封装
- [响应式设计](./04-frontend-admin/09-responsive-design.md) - 移动端适配

### 第五阶段：部署上线

> **目标**：将应用部署到生产环境

**预计时长**：4-5 小时

- [Docker 容器化](./06-deployment/01-docker-containerization.md) - 编写 Dockerfile
- [CI/CD 流水线](./06-deployment/02-ci-cd-pipeline.md) - GitHub Actions 配置
- [云服务部署](./06-deployment/03-cloud-deployment.md) - 云托管部署
- [域名与 SSL](./06-deployment/04-domain-and-ssl.md) - 域名配置与 HTTPS
- [监控告警](./06-deployment/05-monitoring-setup.md) - 日志与监控
- [备份策略](./06-deployment/06-backup-strategy.md) - 数据备份与恢复

### 第六阶段：运维与优化

> **目标**：保障生产环境稳定运行

**预计时长**：3-4 小时

- [日志管理](./07-operations/01-log-management.md) - 日志收集与分析
- [性能优化](./07-operations/02-performance-optimization.md) - 性能调优
- [安全加固](./07-operations/03-security-hardening.md) - 安全最佳实践
- [问题排查](./07-operations/04-troubleshooting.md) - 常见问题排查
- [日常维护](./07-operations/05-maintenance-tasks.md) - 运维检查清单

## 👥 适合人群

- **全栈开发者**：希望学习完整项目开发流程
- **Node.js 开发者**：深入学习 NestJS 后端开发
- **React 开发者**：掌握 Next.js 企业级应用开发
- **架构师/技术负责人**：参考架构设计与技术选型

## 📊 难度等级

- ⭐⭐☆☆☆ **初级**：需要具备 HTML/CSS/JavaScript 基础
- ⭐⭐⭐☆☆ **中级**：熟悉 React/Node.js 开发
- ⭐⭐⭐⭐☆ **高级**：掌握完整全栈开发流程

## ⏱️ 预计时长

- **快速预览**：5-8 小时（仅阅读）
- **动手实践**：20-30 小时（跟随教程完成）
- **深度学习**：40-50 小时（包含扩展功能）

## 🛠️ 前置知识

开始本教程前，建议具备以下知识：

- JavaScript / TypeScript 基础
- React 开发经验（Hooks、组件、状态管理）
- Node.js 基础（npm、模块系统）
- SQL 基础（表、查询、索引）
- Git 基本操作

## 📖 学习建议

1. **循序渐进**：按阶段顺序学习，不要跳跃
2. **动手实践**：每个章节都要亲自写代码
3. **理解原理**：不仅要知道怎么做，还要知道为什么
4. **记录笔记**：记录遇到的问题和解决方案
5. **参考文档**：遇到问题时查看官方文档

## 🔗 相关资源

- [项目 GitHub 仓库](https://github.com/ylc6223/snapmatch-platform)
- [后端 API 文档](https://github.com/ylc6223/snapmatch-platform/blob/main/apps/backend/README.md)
- [技术社区与支持](#)

## 📝 更新日志

- **2025-01-03**：创建教程目录结构和大纲

## 📄 许可证

本教程内容采用 MIT 许可证

---

**开始学习**：[第一阶段：项目规划与架构设计 →](./01-project-planning/README.md)
