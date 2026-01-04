# 管理后台UI开发任务清单

> **状态**: 🚧 开发中
> **预计时长**: 1 天
> **难度**: ⭐⭐⭐☆☆
> **依赖**: [后端API](./02-backend-implementation.md) ✅

## 📊 开发进度

- [ ] Phase 1: 准备工作 (0/2)
- [ ] Phase 2: API客户端 (0/2)
- [ ] Phase 3: 项目列表页 (0/5)
- [ ] Phase 4: 创建项目页 (0/2)
- [ ] Phase 5: 照片列表页 (0/4)
- [ ] Phase 6: 项目详情页 (0/1)
- [ ] Phase 7: 用户体验 (0/3)

---

## Phase 1: 准备工作

### 1.1 创建目录结构

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 5分钟

- [ ] 创建 `apps/admin/app/dashboard/delivery/` 目录
- [ ] 创建 `apps/admin/app/dashboard/delivery/projects/` 目录
- [ ] 创建 `apps/admin/app/dashboard/delivery/projects/new/` 目录
- [ ] 创建 `apps/admin/app/dashboard/delivery/photos/` 目录
- [ ] 创建 `apps/admin/app/dashboard/delivery/photos/[projectId]/` 目录
- [ ] 创建 `apps/admin/lib/api/projects.ts` 文件
- [ ] 创建 `apps/admin/lib/features/projects/` 目录

---

### 1.2 配置路由和导航

**优先级**: 🟡 中
**依赖**: 目录结构创建完成
**预计时间**: 10分钟

- [ ] 打开 `apps/admin/lib/navigation/dashboard-tabs.ts`
- [ ] 添加项目管理tab（`/dashboard/delivery/projects`）
- [ ] 设置排序和图标
- [ ] 配置权限（需要 `projects:read` 权限）

**文件**: `apps/admin/lib/navigation/dashboard-tabs.ts`

**新增代码**:

```typescript
{
  title: '项目管理',
  href: '/dashboard/delivery/projects',
  icon: FolderOpen,
  permission: 'projects:read',
}
```

---

## Phase 2: API客户端

### 2.1 创建类型定义

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 15分钟

- [ ] 创建文件 `apps/admin/lib/api/projects.ts`
- [ ] 定义Project类型
- [ ] 定义CreateProjectDto类型
- [ ] 定义UpdateProjectDto类型
- [ ] 定义Photo类型

**文件**: `apps/admin/lib/api/projects.ts`

**代码**:

```typescript
export interface Project {
  id: string;
  name: string;
  description: string | null;
  token: string;
  viewerUrl: string;
  expiresAt: number | null;
  status: string;
  photoCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  expiresAt?: number;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  expiresAt?: number;
  status?: string;
}

export interface Photo {
  id: string;
  projectId: string;
  filename: string;
  originalKey: string;
  previewKey: string;
  thumbKey: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  status: string;
  selected: boolean;
  selectedAt: number | null;
  createdAt: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}
```

---

### 2.2 实现API方法

**优先级**: 🔴 高
**依赖**: 类型定义完成
**预计时间**: 30分钟

- [ ] 在 `apps/admin/lib/api/projects.ts` 添加API方法
- [ ] 实现create方法
- [ ] 实现findAll方法（支持分页、筛选）
- [ ] 实现findOne方法
- [ ] 实现update方法
- [ ] 实现remove方法
- [ ] 添加错误处理

**文件**: `apps/admin/lib/api/projects.ts`

**新增代码**:

```typescript
import { apiClient } from '../api-client';

export const projectsApi = {
  async create(data: CreateProjectDto): Promise<Project> {
    const { data } = await apiClient.post('/api/projects', data);
    return data;
  },

  async findAll(params?: QueryParams): Promise<Project[]> {
    const { data } = await apiClient.get('/api/projects', { params });
    return data;
  },

  async findOne(id: string): Promise<Project> {
    const { data } = await apiClient.get(`/api/projects/${id}`);
    return data;
  },

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const { data } = await apiClient.patch(`/api/projects/${id}`, data);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/projects/${id}`);
  },
};
```

---

## Phase 3: 项目列表页

### 3.1 创建页面组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 15分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/page.tsx`
- [ ] 添加页面标题
- [ ] 添加布局结构
- [ ] 集成ProjectTable组件
- [ ] 集成CreateProjectButton组件

**文件**: `apps/admin/app/dashboard/delivery/projects/page.tsx`

**代码**:

```typescript
import { Button } from '@/components/ui/button';
import { ProjectTable } from './components/ProjectTable';
import { CreateProjectButton } from './components/CreateProjectButton';

export default function ProjectsListPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">项目管理</h1>
          <p className="text-muted-foreground mt-2">
            管理照片项目和选片链接
          </p>
        </div>
        <CreateProjectButton />
      </div>

      <ProjectTable />
    </div>
  );
}
```

---

### 3.2 创建ProjectTable组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 45分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/components/ProjectTable.tsx`
- [ ] 实现表格列定义
- [ ] 添加分页功能
- [ ] 添加排序功能
- [ ] 实现操作按钮（查看、编辑、删除、复制链接）
- [ ] 添加空状态提示

**文件**: `apps/admin/app/dashboard/delivery/projects/components/ProjectTable.tsx`

**代码**:

```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { Project } from '@/lib/api/projects';
import { useProjects } from '@/lib/features/projects/use-projects';
import { useDeleteProject } from '@/lib/features/projects/use-projects';

export function ProjectTable() {
  const { data, loading } = useProjects();
  const deleteProject = useDeleteProject();

  const handleCopyLink = (viewerUrl: string) => {
    navigator.clipboard.writeText(viewerUrl);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无项目</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>项目名称</TableHead>
            <TableHead>照片数量</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.photoCount}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    project.status === 'active'
                      ? 'default'
                      : project.status === 'submitted'
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(project.createdAt).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyLink(project.viewerUrl)}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      复制链接
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteProject.mutate(project.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### 3.3 创建ProjectFilters组件

**优先级**: 🟢 低
**依赖**: 无
**预计时间**: 20分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/components/ProjectFilters.tsx`
- [ ] 添加状态筛选下拉框
- [ ] 添加搜索框
- [ ] 实现筛选逻辑

**文件**: `apps/admin/app/dashboard/delivery/projects/components/ProjectFilters.tsx`

**代码**:

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProjectFilters() {
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  return (
    <div className="flex gap-4">
      <Input
        placeholder="搜索项目名称..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="active">活跃</SelectItem>
          <SelectItem value="submitted">已提交</SelectItem>
          <SelectItem value="expired">已过期</SelectItem>
          <SelectItem value="revoked">已撤销</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

### 3.4 创建CreateProjectButton组件

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 10分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/components/CreateProjectButton.tsx`
- [ ] 实现点击跳转

**文件**: `apps/admin/app/dashboard/delivery/projects/components/CreateProjectButton.tsx`

**代码**:

```typescript
'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CreateProjectButton() {
  return (
    <Link href="/dashboard/delivery/projects/new">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        创建项目
      </Button>
    </Link>
  );
}
```

---

### 3.5 实现Hooks

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 30分钟

- [ ] 创建文件 `apps/admin/lib/features/projects/use-projects.ts`
- [ ] 实现useProjects（调用API，支持缓存）
- [ ] 实现useCreateProject（mutation）
- [ ] 实现useUpdateProject（mutation）
- [ ] 实现useDeleteProject（mutation）
- [ ] 使用React Query或Zustand

**文件**: `apps/admin/lib/features/projects/use-projects.ts`

**代码**:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Project, CreateProjectDto, UpdateProjectDto } from '@/lib/api/projects';

export function useProjects(params?: any) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.findAll(params),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

---

## Phase 4: 创建项目页

### 4.1 创建页面组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 15分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/new/page.tsx`
- [ ] 添加面包屑导航
- [ ] 添加返回按钮
- [ ] 集成CreateProjectForm组件

**文件**: `apps/admin/app/dashboard/delivery/projects/new/page.tsx`

**代码**:

```typescript
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectForm } from '../components/CreateProjectForm';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/delivery/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">创建项目</h1>
          <p className="text-muted-foreground mt-2">
            填写项目信息并生成选片链接
          </p>
        </div>
      </div>

      <CreateProjectForm />
    </div>
  );
}
```

---

### 4.2 创建CreateProjectForm组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 45分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/components/CreateProjectForm.tsx`
- [ ] 使用shadcn Form组件
- [ ] 添加表单验证
- [ ] 实现提交逻辑
- [ ] 添加提交成功后的跳转

**文件**: `apps/admin/app/dashboard/delivery/projects/components/CreateProjectForm.tsx`

**代码**:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProject } from '@/lib/features/projects/use-projects';

const formSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().optional(),
  expiresAt: z.number().optional(),
});

export function CreateProjectForm() {
  const router = useRouter();
  const createProject = useCreateProject();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync(values);
    router.push('/dashboard/delivery/projects');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>项目名称 *</FormLabel>
              <FormControl>
                <Input placeholder="例如：李四婚纱照选片" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>项目描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="拍摄时间、地点等信息..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createProject.isPending}>
          {createProject.isPending ? '创建中...' : '创建项目'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Phase 5: 照片列表页

### 5.1 创建页面组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 15分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/photos/[projectId]/page.tsx`
- [ ] 从params获取projectId
- [ ] 显示项目名称和描述
- [ ] 显示照片数量统计
- [ ] 集成PhotoGrid组件
- [ ] 集成PhotoUploadButton组件

**文件**: `apps/admin/app/dashboard/delivery/photos/[projectId]/page.tsx`

**代码**:

```typescript
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoUploadButton } from './components/PhotoUploadButton';

export default function PhotosListPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">项目照片</h1>
          <p className="text-muted-foreground mt-2">
            管理项目照片和上传
          </p>
        </div>
        <PhotoUploadButton projectId={params.projectId} />
      </div>

      <PhotoGrid projectId={params.projectId} />
    </div>
  );
}
```

---

### 5.2 创建PhotoGrid组件

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 45分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/photos/[projectId]/components/PhotoGrid.tsx`
- [ ] 实现网格布局
- [ ] 显示缩略图
- [ ] 悬停时显示操作按钮
- [ ] 支持选中多张照片
- [ ] 实现虚拟滚动（可选）

**文件**: `apps/admin/app/dashboard/delivery/photos/[projectId]/components/PhotoGrid.tsx`

**代码**:

```typescript
'use client';

import Image from 'next/image';
import { Photo } from '@/lib/api/projects';
import { usePhotos } from '@/lib/features/projects/use-photos';

interface PhotoGridProps {
  projectId: string;
}

export function PhotoGrid({ projectId }: PhotoGridProps) {
  const { data, loading } = usePhotos(projectId);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无照片</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square group overflow-hidden rounded-lg border"
        >
          <Image
            src={photo.previewKey}
            alt={photo.filename}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm">
                查看
              </Button>
              <Button variant="destructive" size="sm">
                删除
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 5.3 创建PhotoUploadButton组件

**优先级**: 🔴 高
**依赖**: 上传功能
**预计时间**: 20分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/photos/[projectId]/components/PhotoUploadButton.tsx`
- [ ] 点击打开AssetUpload组件
- [ ] 传递projectId到上传组件
- [ ] 上传完成后刷新照片列表
- [ ] 显示上传进度

**文件**: `apps/admin/app/dashboard/delivery/photos/[projectId]/components/PhotoUploadButton.tsx`

**代码**:

```typescript
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AssetUpload } from '@/components/features/upload/asset-upload';

interface PhotoUploadButtonProps {
  projectId: string;
}

export function PhotoUploadButton({ projectId }: PhotoUploadButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          上传照片
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>上传照片到项目</DialogTitle>
        </DialogHeader>
        <AssetUpload
          projectId={projectId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.4 实现照片相关Hooks

**优先级**: 🔴 高
**依赖**: API客户端完成
**预计时间**: 20分钟

- [ ] 创建文件 `apps/admin/lib/features/projects/use-photos.ts`
- [ ] 实现usePhotos
- [ ] 实现useDeletePhotos

**文件**: `apps/admin/lib/features/projects/use-photos.ts`

**代码**:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Photo } from '@/lib/api/projects';

async function fetchPhotos(projectId: string): Promise<Photo[]> {
  const res = await fetch(`/api/projects/${projectId}/photos`);
  if (!res.ok) throw new Error('Failed to fetch photos');
  return res.json();
}

export function usePhotos(projectId: string) {
  return useQuery({
    queryKey: ['photos', projectId],
    queryFn: () => fetchPhotos(projectId),
  });
}

export function useDeletePhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, photoIds }: { projectId: string; photoIds: string[] }) => {
      const res = await fetch(`/api/projects/${projectId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
      });
      if (!res.ok) throw new Error('Failed to delete photos');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photos', variables.projectId] });
    },
  });
}
```

---

## Phase 6: 项目详情页（可选）

### 6.1 创建详情页面

**优先级**: 🟢 低
**依赖**: API客户端完成
**预计时间**: 30分钟

- [ ] 创建文件 `apps/admin/app/dashboard/delivery/projects/[id]/page.tsx`
- [ ] 显示项目基本信息
- [ ] 显示统计卡片
- [ ] 集成操作按钮区域

**文件**: `apps/admin/app/dashboard/delivery/projects/[id]/page.tsx`

---

## Phase 7: 用户体验优化

### 7.1 加载状态

**优先级**: 🟡 中
**依赖**: 所有页面完成
**预计时间**: 20分钟

- [ ] 列表页loading骨架屏
- [ ] 照片网格loading状态
- [ ] 按钮loading禁用状态

---

### 7.2 错误处理

**优先级**: 🟡 中
**依赖**: 所有页面完成
**预计时间**: 20分钟

- [ ] API错误提示
- [ ] 网络错误重试
- [ ] 友好的错误消息

---

### 7.3 成功反馈

**优先级**: 🟡 中
**依赖**: 所有页面完成
**预计时间**: 15分钟

- [ ] 创建成功提示
- [ ] 删除成功确认
- [ ] 链接复制成功提示
- [ ] 上传完成提示

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有页面都已实现
- [ ] 所有API调用都正常
- [ ] 所有按钮都有交互反馈

### 用户体验

- [ ] 页面加载流畅（< 2秒）
- [ ] 操作响应及时（< 500ms）
- [ ] 错误提示友好
- [ ] 界面美观一致

### 代码质量

- [ ] TypeScript类型完整
- [ ] 组件拆分合理
- [ ] Hooks复用性好
- [ ] ESLint无错误

---

## 📝 相关文档

- [选片端UI](./04-viewer-ui.md) | 下一步：实现选片界面
- [后端实现](./02-backend-implementation.md) | 前置依赖
- [术语规范](./00-terminology.md) | 术语定义
