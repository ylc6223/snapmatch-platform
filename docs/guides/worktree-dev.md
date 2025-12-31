# Worktree 并行开发（自动分配端口，一键启动）

当你在同一台电脑上用多个 git worktree（或多个目录）同时运行本项目时，最常见的问题是 **端口冲突**（例如都占用 `3000/3001/3002`）。

本项目提供了一个「无脑一键」脚本：会自动寻找一组可用端口并同时启动 Web/Admin/Backend，避免与其它 worktree 互相影响。

## 1. 一键启动（推荐）

在当前 worktree 根目录运行：

```bash
pnpm dev:worktree
```

脚本会：

- 默认按 **worktree 路径固定映射** 分配一组端口（不同 worktree 默认不会混用端口）；若检测到端口被占用，会自动换到下一组可用端口并写入本 worktree 的本地配置文件。
- 同时启动：
  - `apps/web`（Web 官网）
  - `apps/admin`（管理后台）
  - `apps/backend`（NestJS API）
- 自动配置三端之间的互相调用：
  - Web → Admin：`NEXT_PUBLIC_ADMIN_BASE_URL=http://localhost:<adminPort>/admin`（会自动带上 Admin 的 basePath）
  - Admin → Backend：`BACKEND_BASE_URL=http://localhost:<backendPort>`
  - Backend CORS：`ADMIN_ORIGIN=http://localhost:<adminPort>`（注意：origin 不包含路径）

## 2. 本地配置文件（不会被合并覆盖）

首次运行后，会在仓库根目录生成：

- `.env.worktree.local`

该文件用于记录当前 worktree 的端口分配与联动变量，且已被 `.gitignore` 忽略：

- 不会被提交到 git
- 不会在未来分支合并时被覆盖
- 你可以直接修改其中的 `PORT_WEB/PORT_ADMIN/PORT_BACKEND` 来固定端口

## 3. 端口被占用时的行为

如果 `.env.worktree.local` 中保存的端口已被其它进程占用，脚本会自动切换到新的端口组并更新 `.env.worktree.local`。

如需强制重新分配（忽略现有配置）：

```bash
pnpm dev:worktree -- --reset
```

只想查看会使用哪些端口（不启动服务）：

```bash
pnpm dev:worktree -- --print
```

## 4. 可选：自定义起始端口

默认从 `3000` 开始尝试，你也可以指定起始端口（仍然按 100 递增寻找端口组）：

```bash
WORKTREE_PORT_BASE=4000 pnpm dev:worktree
```

## 5. 可选：手动指定端口组编号

如果你希望“固定落在某一组端口”或你的环境无法探测端口占用，可以指定端口组编号（每组跨度为 100）：

- `WORKTREE_PORT_GROUP=0` → `3000/3001/3002`
- `WORKTREE_PORT_GROUP=1` → `3100/3101/3102`

示例：

```bash
WORKTREE_PORT_GROUP=1 pnpm dev:worktree
```
