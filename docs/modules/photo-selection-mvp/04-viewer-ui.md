# 选片端UI开发任务清单

> **状态**: 🚧 开发中
> **预计时长**: 1 天
> **难度**: ⭐⭐⭐⭐☆
> **依赖**: [后端实现](./02-backend-implementation.md) ✅

## 📊 开发进度

- [ ] Phase 1: 准备工作 (0/2)
- [ ] Phase 2: Viewer主页面 (0/3)
- [ ] Phase 3: 照片网格组件 (0/2)
- [ ] Phase 4: 大图查看器 (0/1)
- [ ] Phase 5: 选片面板 (0/2)
- [ ] Phase 6: 提交流程 (0/2)
- [ ] Phase 7: 实现Hooks (0/2)
- [ ] Phase 8: 用户体验优化 (0/3)
- [ ] Phase 9: 安全与防护 (0/2)

---

## Phase 1: 准备工作

### 1.1 创建目录结构

**优先级**: 🔴 高
**依赖**: 无
**预计时间**: 5分钟

- [ ] 创建 `apps/admin/app/(guest)/viewer/[token]/` 目录
- [ ] 创建 `apps/admin/components/features/viewer/` 目录
- [ ] 创建 `apps/admin/lib/features/viewer/` 目录

**目录结构**:

```
apps/admin/
├── app/
│   └── (guest)/viewer/[token]/
│       ├── page.tsx
│       └── components/
├── components/
│   └── features/viewer/
└── lib/
    └── features/viewer/
```

---

### 1.2 路由配置验证

**优先级**: 🔴 高
**依赖**: 目录结构创建完成
**预计时间**: 5分钟

- [ ] 确认 `(guest)` 布局已配置（无需登录）
- [ ] 验证动态路由 `[token]` 配置正确
- [ ] 测试路由是否正常解析

**文件**: `apps/admin/app/(guest)/layout.tsx`

**验证**:

- [ ] 访问 `/viewer/test-token` 能正常渲染
- [ ] 无需登录即可访问

---

## Phase 2: 实现Viewer主页面

### 2.1 创建页面组件

**优先级**: 🔴 高
**依赖**: 路由配置完成
**预计时间**: 20分钟

- [ ] 创建 `app/(guest)/viewer/[token]/page.tsx`
- [ ] 从 params 获取 token
- [ ] 从 searchParams 获取显示模式（grid/lightbox）
- [ ] 集成 useViewer hook
- [ ] 实现错误处理（Token无效、过期、撤销）

**文件**: `apps/admin/app/(guest)/viewer/[token]/page.tsx`

**代码**:

```typescript
import { notFound } from 'next/navigation';
import { ViewerError } from '../components/ViewerError';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoLightbox } from './components/PhotoLightbox';
import { SelectionSummary } from './components/SelectionSummary';
import { useViewer } from '@admin/lib/features/viewer/use-viewer';
import { usePhotoSelection } from '@admin/lib/features/viewer/use-photo-selection';

interface ViewerPageProps {
  params: { token: string };
  searchParams: { mode?: 'grid' | 'lightbox' };
}

export default function ViewerPage({ params, searchParams }: ViewerPageProps) {
  const { data, loading, error } = useViewer(params.token);
  const {
    selectedPhotos,
    togglePhoto,
    clearAll,
    submitSelection,
    submitting,
  } = usePhotoSelection(params.token);

  // 错误处理
  if (error) {
    const errorType = error.response?.data?.message;
    if (errorType === 'Invalid token') {
      return <ViewerError type="invalid" />;
    }
    if (errorType === 'Project has expired') {
      return <ViewerError type="expired" />;
    }
    if (errorType === 'Project has been revoked') {
      return <ViewerError type="revoked" />;
    }
    return <ViewerError type="network" />;
  }

  // 加载状态
  if (loading) {
    return <ViewerSkeleton />;
  }

  // 空项目
  if (!data?.photos.length) {
    return <ViewerEmpty project={data.project} />;
  }

  const mode = searchParams.mode || 'grid';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 项目信息 */}
      <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-40 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">{data.project.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.project.description || '选片项目'}
          </p>
        </div>
      </header>

      {/* 选片统计 */}
      <SelectionSummary
        selectedCount={selectedPhotos.size}
        totalCount={data.photos.length}
        projectName={data.project.name}
        onSubmit={submitSelection}
        submitting={submitting}
      />

      {/* 主内容区 */}
      <main className="pt-32 pb-24">
        {mode === 'lightbox' ? (
          <PhotoLightbox
            photos={data.photos}
            selectedPhotos={selectedPhotos}
            onPhotoToggle={togglePhoto}
            onClose={() => {
              // 切换回网格模式
              window.location.href = `/viewer/${params.token}`;
            }}
          />
        ) : (
          <PhotoGrid
            photos={data.photos}
            selectedPhotos={selectedPhotos}
            onPhotoToggle={togglePhoto}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
```

---

### 2.2 错误状态组件

**优先级**: 🟡 中
**依赖**: 页面组件创建
**预计时间**: 15分钟

- [ ] 创建 ViewerError 组件
- [ ] 实现四种错误状态（invalid/expired/revoked/network）
- [ ] 添加友好的错误提示和设计

**文件**: `apps/admin/app/(guest)/viewer/components/ViewerError.tsx`

**代码**:

```typescript
import { AlertCircle } from 'lucide-react';

interface ViewerErrorProps {
  type: 'invalid' | 'expired' | 'revoked' | 'network';
}

export function ViewerError({ type }: ViewerErrorProps) {
  const errorConfig = {
    invalid: {
      title: '链接无效',
      message: '该选片链接不存在或已被删除',
      icon: AlertCircle,
    },
    expired: {
      title: '链接已过期',
      message: '该选片链接已过期，请联系摄影师',
      icon: AlertCircle,
    },
    revoked: {
      title: '链接已失效',
      message: '该选片链接已被撤销，请联系摄影师',
      icon: AlertCircle,
    },
    network: {
      title: '网络错误',
      message: '请检查网络连接后重试',
      icon: AlertCircle,
    },
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {config.title}
        </h1>

        <p className="text-gray-400 mb-8">{config.message}</p>

        {type !== 'network' && (
          <div className="bg-gray-900 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300 mb-2">
              如有疑问，请联系摄影师
            </p>
            <a
              href="mailto:photographer@example.com"
              className="text-sm text-blue-400 hover:underline"
            >
              联系摄影师 →
            </a>
          </div>
        )}

        {type === 'network' && (
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            重新加载
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### 2.3 加载骨架屏

**优先级**: 🟡 中
**依赖**: 页面组件创建
**预计时间**: 10分钟

- [ ] 创建 ViewerSkeleton 组件
- [ ] 实现骨架屏动画效果

**文件**: `apps/admin/app/(guest)/viewer/components/ViewerSkeleton.tsx`

**代码**:

```typescript
export function ViewerSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-40 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="h-6 bg-gray-800 rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-gray-800 rounded w-32 animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <main className="pt-32 pb-24 container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-900 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## Phase 3: 实现照片网格组件

### 3.1 照片网格

**优先级**: 🔴 高
**依赖**: 页面组件创建
**预计时间**: 30分钟

- [ ] 创建 PhotoGrid 组件
- [ ] 实现响应式网格布局（移动端2列，平板3列，桌面4列）
- [ ] 集成 PhotoCard 组件
- [ ] 实现点击切换选择状态
- [ ] 添加加载占位符

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/PhotoGrid.tsx`

**代码**:

```typescript
import { Photo } from '@admin/lib/types';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  selectedPhotos: Set<string>;
  onPhotoToggle: (photoId: string) => void;
  loading?: boolean;
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onPhotoToggle,
  loading,
}: PhotoGridProps) {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            selected={selectedPhotos.has(photo.id)}
            onToggle={() => onPhotoToggle(photo.id)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
}
```

---

### 3.2 照片卡片

**优先级**: 🔴 高
**依赖**: PhotoGrid 组件
**预计时间**: 25分钟

- [ ] 创建 PhotoCard 组件
- [ ] 显示缩略图
- [ ] 显示选中标记（蓝色边框 + 对勾图标）
- [ ] 悬停时显示遮罩和"点击选择"提示
- [ ] 实现图片懒加载
- [ ] 添加加载占位符

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/PhotoCard.tsx`

**代码**:

```typescript
import { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Photo } from '@admin/lib/types';
import { cn } from '@admin/lib/utils';

interface PhotoCardProps {
  photo: Photo;
  selected: boolean;
  onToggle: () => void;
}

export function PhotoCard({ photo, selected, onToggle }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // 构建 R2 图片 URL
  const getPhotoUrl = (key: string) => {
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg cursor-pointer',
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        selected && 'ring-4 ring-blue-600'
      )}
    >
      {/* 加载占位符 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}

      {/* 图片 */}
      <Image
        src={getPhotoUrl(photo.previewKey)}
        alt={photo.filename}
        fill
        className="object-cover"
        onLoad={() => setImageLoaded(true)}
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white text-sm font-medium">
            {selected ? '取消选择' : '点击选择'}
          </span>
        </div>
      </div>

      {/* 选中标记 */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* 图片信息 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity">
        <p className="text-white text-xs truncate">
          {photo.filename}
        </p>
      </div>
    </button>
  );
}
```

---

## Phase 4: 实现大图查看器

### 4.1 大图查看器

**优先级**: 🔴 高
**依赖**: 页面组件创建
**预计时间**: 45分钟

- [ ] 创建 PhotoLightbox 组件
- [ ] 实现全屏显示
- [ ] 实现左右切换照片（键盘 ← →，点击边缘）
- [ ] 实现空格键标记照片
- [ ] ESC 关闭
- [ ] 显示照片信息（文件名、尺寸）
- [ ] 显示选中状态
- [ ] 支持触摸滑动（移动端）

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/PhotoLightbox.tsx`

**代码**:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { Photo } from '@admin/lib/types';
import { cn } from '@admin/lib/utils';

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex?: number;
  selectedPhotos: Set<string>;
  onPhotoToggle: (photoId: string) => void;
  onClose: () => void;
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  selectedPhotos,
  onPhotoToggle,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);

  const currentPhoto = photos[currentIndex];
  const selected = selectedPhotos.has(currentPhoto.id);

  // 构建 R2 图片 URL
  const getPhotoUrl = (key: string) => {
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex((i) => Math.max(0, i - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentIndex((i) => Math.min(photos.length - 1, i + 1));
          break;
        case ' ':
          e.preventDefault();
          onPhotoToggle(currentPhoto.id);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPhoto.id, photos.length, onPhotoToggle, onClose]);

  // 切换到上一张
  const goToPrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // 切换到下一张
  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(photos.length - 1, i + 1));
  }, [photos.length]);

  // 切换选择状态
  const toggleSelection = () => {
    onPhotoToggle(currentPhoto.id);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="关闭"
      >
        <X className="w-8 h-8" />
      </button>

      {/* 信息按钮 */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="absolute top-4 right-16 z-50 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="显示信息"
      >
        <Info className="w-6 h-6" />
      </button>

      {/* 照片信息 */}
      {showInfo && (
        <div className="absolute top-16 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-xs">
          <h3 className="text-white font-medium mb-2">{currentPhoto.filename}</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>尺寸: {currentPhoto.width} × {currentPhoto.height}</p>
            <p>大小: {(currentPhoto.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}

      {/* 上一张按钮 */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white/70 hover:text-white transition-colors"
          aria-label="上一张"
        >
          <ChevronLeft className="w-12 h-12" />
        </button>
      )}

      {/* 下一张按钮 */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white/70 hover:text-white transition-colors"
          aria-label="下一张"
        >
          <ChevronRight className="w-12 h-12" />
        </button>
      )}

      {/* 照片显示 */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <Image
          src={getPhotoUrl(currentPhoto.originalKey)}
          alt={currentPhoto.filename}
          width={currentPhoto.width || 1920}
          height={currentPhoto.height || 1080}
          className="max-w-full max-h-full object-contain"
          priority
        />
      </div>

      {/* 底部操作栏 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        {/* 选择按钮 */}
        <button
          onClick={toggleSelection}
          className={cn(
            'px-6 py-3 rounded-full font-medium transition-all',
            selected
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          )}
        >
          {selected ? '✓ 已选择' : '点击选择'}
        </button>

        {/* 照片计数 */}
        <span className="text-white/70 text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>

      {/* 触摸区域（移动端） */}
      <div className="absolute inset-0 flex">
        <div className="w-1/3 h-full" onClick={goToPrevious} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={goToNext} />
      </div>
    </div>
  );
}
```

---

## Phase 5: 实现选片面板

### 5.1 选片统计

**优先级**: 🔴 高
**依赖**: 页面组件创建
**预计时间**: 20分钟

- [ ] 创建 SelectionSummary 组件
- [ ] 固定在页面底部
- [ ] 显示项目名称
- [ ] 显示已选数量 / 总数量
- [ ] 显示进度条（可选）
- [ ] 提交按钮（带 loading 状态）

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/SelectionSummary.tsx`

**代码**:

```typescript
import { Check } from 'lucide-react';
import { cn } from '@admin/lib/utils';

interface SelectionSummaryProps {
  selectedCount: number;
  totalCount: number;
  projectName: string;
  onSubmit: () => void;
  submitting?: boolean;
}

export function SelectionSummary({
  selectedCount,
  totalCount,
  projectName,
  onSubmit,
  submitting,
}: SelectionSummaryProps) {
  const percentage = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧：统计信息 */}
          <div className="flex items-center gap-4 flex-1">
            {/* 图标 */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              selectedCount > 0 ? 'bg-blue-600' : 'bg-gray-800'
            )}>
              <Check className={cn(
                'w-5 h-5 transition-colors',
                selectedCount > 0 ? 'text-white' : 'text-gray-600'
              )} />
            </div>

            {/* 文本 */}
            <div className="flex-1">
              <p className="text-sm text-gray-400">
                {projectName}
              </p>
              <p className="text-lg font-semibold text-white">
                已选 {selectedCount} / 总计 {totalCount} 张
              </p>
            </div>

            {/* 进度条 */}
            {totalCount > 0 && (
              <div className="hidden sm:block w-32">
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 右侧：提交按钮 */}
          <button
            onClick={onSubmit}
            disabled={selectedCount === 0 || submitting}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap',
              selectedCount > 0 && !submitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            )}
          >
            {submitting ? '提交中...' : '提交选片'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 5.2 已选照片面板

**优先级**: 🟡 中
**依赖**: SelectionSummary 组件
**预计时间**: 25分钟

- [ ] 创建 SelectionPanel 组件
- [ ] 侧边抽屉样式
- [ ] 网格显示已选照片
- [ ] 点击移除按钮
- [ ] 全部清除按钮
- [ ] 数量统计

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/SelectionPanel.tsx`

**代码**:

```typescript
'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { Photo } from '@admin/lib/types';

interface SelectionPanelProps {
  photos: Photo[];
  onRemove: (photoId: string) => void;
  onClearAll: () => void;
  open: boolean;
  onClose: () => void;
}

export function SelectionPanel({
  photos,
  onRemove,
  onClearAll,
  open,
  onClose,
}: SelectionPanelProps) {
  // 构建 R2 图片 URL
  const getPhotoUrl = (key: string) => {
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  };

  return (
    <>
      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 侧边面板 */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-black border-l border-gray-800 z-50
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              已选照片 ({photos.length})
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              点击移除按钮取消选择
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 清除全部 */}
            {photos.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                清除全部
              </button>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 照片列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-400">还没有选择照片</p>
              <p className="text-sm text-gray-600 mt-1">
                点击照片进行选择
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <Image
                    src={getPhotoUrl(photo.thumbKey || photo.previewKey)}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 192px"
                  />

                  {/* 移除按钮 */}
                  <button
                    onClick={() => onRemove(photo.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* 文件名 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs truncate">
                      {photo.filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {photos.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              继续选片
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

---

## Phase 6: 实现提交流程

### 6.1 提交对话框

**优先级**: 🔴 高
**依赖**: 页面组件创建
**预计时间**: 20分钟

- [ ] 创建 SubmitDialog 组件
- [ ] 显示确认提示（已选择 X 张照片）
- [ ] 提交后锁定提示
- [ ] 确认按钮（带 loading）
- [ ] 取消按钮

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/SubmitDialog.tsx`

**代码**:

```typescript
'use client';

import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog';

interface SubmitDialogProps {
  open: boolean;
  selectedCount: number;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
}

export function SubmitDialog({
  open,
  selectedCount,
  projectName,
  onConfirm,
  onCancel,
  submitting,
}: SubmitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => !submitting && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">确认提交选片？</DialogTitle>
          <DialogDescription className="text-base pt-2">
            此操作不可撤销，提交后您将无法继续修改选择。
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-white">
                项目: {projectName}
              </p>
              <p className="text-sm text-gray-300">
                已选择 <span className="font-semibold text-blue-400">{selectedCount}</span> 张照片
              </p>
              <p className="text-xs text-gray-400 mt-2">
                提交后，摄影师将收到您的选片结果，并会尽快联系您。
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            再想想
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '确认提交'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 6.2 提交成功页面

**优先级**: 🟡 中
**依赖**: SubmitDialog 组件
**预计时间**: 15分钟

- [ ] 创建 SubmissionSuccess 组件
- [ ] 显示成功图标
- [ ] 感谢语
- [ ] 提示已提交 X 张照片
- [ ] 后续步骤说明（等待摄影师通知）
- [ ] 锁定所有操作

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/SubmissionSuccess.tsx`

**代码**:

```typescript
import { CheckCircle } from 'lucide-react';

interface SubmissionSuccessProps {
  projectName: string;
  submittedCount: number;
}

export function SubmissionSuccess({
  projectName,
  submittedCount,
}: SubmissionSuccessProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 成功图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-white mb-3">
          选片提交成功！
        </h1>

        {/* 感谢语 */}
        <p className="text-lg text-gray-300 mb-8">
          感谢您的耐心选片
        </p>

        {/* 统计信息 */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-400 mb-2">项目名称</p>
          <p className="text-lg font-semibold text-white mb-4">
            {projectName}
          </p>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-sm text-gray-400 mb-2">已提交照片</p>
            <p className="text-3xl font-bold text-blue-600">
              {submittedCount} 张
            </p>
          </div>
        </div>

        {/* 后续步骤 */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-white mb-2">
            后续步骤：
          </p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 摄影师会收到您的选片结果</li>
            <li>• 预计 3-5 个工作日内会联系您</li>
            <li>• 如有疑问，可随时联系摄影师</li>
          </ul>
        </div>

        {/* 联系方式 */}
        <div className="mt-8 text-sm text-gray-400">
          如有疑问，请联系摄影师
          <a
            href="mailto:photographer@example.com"
            className="text-blue-400 hover:underline ml-1"
          >
            photographer@example.com
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 7: 实现Hooks

### 7.1 Viewer Hook

**优先级**: 🔴 高
**依赖**: Viewer API
**预计时间**: 20分钟

- [ ] 创建 useViewer hook
- [ ] 调用 Viewer API
- [ ] 实现缓存策略
- [ ] 处理 loading 和 error

**文件**: `apps/admin/lib/features/viewer/use-viewer.ts`

**代码**:

```typescript
import { useQuery } from '@tanstack/react-query';
import { viewerApi } from '@admin/lib/api/viewer';
import { Photo } from '@admin/lib/types';

interface ViewerData {
  project: {
    id: string;
    name: string;
    description?: string;
    token: string;
    status: string;
    photoCount: number;
    expiresAt?: number;
  };
  photos: Photo[];
}

export function useViewer(token: string) {
  return useQuery<ViewerData>({
    queryKey: ['viewer', token],
    queryFn: () => viewerApi.getProject(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 分钟
    retry: 1,
  });
}
```

---

### 7.2 选片 Hook

**优先级**: 🔴 高
**依赖**: Viewer API
**预计时间**: 30分钟

- [ ] 创建 usePhotoSelection hook
- [ ] 维护已选照片 Set
- [ ] 实现 togglePhoto 方法
- [ ] 实现 clearAll 方法
- [ ] 实现 submitSelection 方法
- [ ] 本地持久化（localStorage）
- [ ] 自动从 API 同步已选状态

**文件**: `apps/admin/lib/features/viewer/use-photo-selection.ts`

**代码**:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { viewerApi } from '@admin/lib/api/viewer';
import { Photo } from '@admin/lib/types';

const STORAGE_KEY = (token: string) => `viewer-selection-${token}`;

export function usePhotoSelection(token: string) {
  // 从 API 获取已选照片
  const { data: selectedPhotos } = useQuery<Photo[]>({
    queryKey: ['viewer-selection', token],
    queryFn: () => viewerApi.getSelectedPhotos(token),
    enabled: !!token,
    staleTime: 0, // 始终获取最新数据
  });

  // 本地状态：使用 Set 存储选中的照片 ID
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  // 初始化：从 API 数据同步到本地状态
  useEffect(() => {
    if (selectedPhotos) {
      const ids = new Set(selectedPhotos.map((p) => p.id));
      setSelectedSet(ids);

      // 同步到 localStorage
      localStorage.setItem(STORAGE_KEY(token), JSON.stringify([...ids]));
    }
  }, [selectedPhotos, token]);

  // 初始化：从 localStorage 恢复（可选，用于刷新页面）
  useEffect(() => {
    if (!selectedPhotos) {
      const stored = localStorage.getItem(STORAGE_KEY(token));
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setSelectedSet(new Set(ids));
        } catch (e) {
          console.error('Failed to parse stored selection:', e);
        }
      }
    }
  }, [token, selectedPhotos]);

  // 切换照片选择状态
  const toggleMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return viewerApi.togglePhoto(token, photoId);
    },
    onSuccess: (updatedPhoto) => {
      const newSet = new Set(selectedSet);
      if (updatedPhoto.selected) {
        newSet.add(updatedPhoto.id);
      } else {
        newSet.delete(updatedPhoto.id);
      }
      setSelectedSet(newSet);

      // 同步到 localStorage
      localStorage.setItem(STORAGE_KEY(token), JSON.stringify([...newSet]));
    },
  });

  // 提交选片
  const submitMutation = useMutation({
    mutationFn: () => viewerApi.submitSelection(token),
    onSuccess: () => {
      // 清除本地存储
      localStorage.removeItem(STORAGE_KEY(token));
    },
  });

  const togglePhoto = useCallback(
    (photoId: string) => {
      toggleMutation.mutate(photoId);
    },
    [toggleMutation],
  );

  const clearAll = useCallback(() => {
    // 注意：这需要后端 API 支持
    // 目前只能通过逐个取消来实现
    setSelectedSet(new Set());
    localStorage.removeItem(STORAGE_KEY(token));
  }, [token]);

  const submitSelection = useCallback(() => {
    submitMutation.mutate();
  }, [submitMutation]);

  return {
    selectedPhotos: selectedSet,
    togglePhoto,
    clearAll,
    submitSelection,
    submitting: submitMutation.isPending,
    toggling: toggleMutation.isPending,
  };
}
```

---

## Phase 8: 用户体验优化

### 8.1 键盘快捷键

**优先级**: 🟡 中
**依赖**: PhotoLightbox 组件
**预计时间**: 15分钟

- [ ] 创建键盘事件处理器
- [ ] 实现快捷键：
  - `←` `→` 切换照片（大图模式）
  - `Space` 标记照片
  - `ESC` 关闭大图/对话框
  - `Enter` 提交选片
- [ ] 添加快捷键提示

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/KeyboardShortcuts.tsx`

**代码**:

```typescript
'use client';

import { useEffect } from 'react';
import { Keyboard } from 'lucide-react';

interface ShortcutConfig {
  key: string;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcut = shortcuts.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function KeyboardShortcutsTooltip() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors"
        onClick={() => {
          // 显示快捷键帮助对话框
        }}
      >
        <Keyboard className="w-5 h-5" />
      </button>
    </div>
  );
}
```

---

### 8.2 加载状态优化

**优先级**: 🟡 中
**依赖**: 所有组件创建完成
**预计时间**: 15分钟

- [ ] 优化初始加载骨架屏
- [ ] 添加图片加载占位符
- [ ] 实现按钮加载禁用状态
- [ ] 添加过渡动画

**实现要点**:

- 使用 `animate-pulse` 实现骨架屏动画
- 图片 `onLoad` 回调移除占位符
- 按钮 `disabled` 属性 + `opacity-50` 样式
- 使用 Tailwind `transition-*` 类添加过渡

---

### 8.3 响应式设计验证

**优先级**: 🟡 中
**依赖**: 所有组件创建完成
**预计时间**: 20分钟

- [ ] 桌面端（> 1024px）- 4列网格
- [ ] 平板端（768px - 1024px）- 3列网格
- [ ] 手机端（< 768px）- 2列网格
- [ ] 移动端优化按钮大小（最小 44x44px）

**验证清单**:

- [ ] 使用 Chrome DevTools 测试不同设备
- [ ] 测试横屏和竖屏模式
- [ ] 测试触摸操作
- [ ] 验证字体大小可读（移动端最小 14px）

---

## Phase 9: 安全与防护

### 9.1 防盗链实现

**优先级**: 🟢 低
**依赖**: PhotoCard, PhotoLightbox 组件
**预计时间**: 15分钟

- [ ] 禁用右键菜单
- [ ] 禁用图片拖拽
- [ ] 添加透明遮罩层（可选）
- [ ] 预览图强制水印（后端实现）

**文件**: `apps/admin/app/(guest)/viewer/[token]/components/PhotoProtection.tsx`

**代码**:

```typescript
'use client';

import { useEffect } from 'react';

export function usePhotoProtection() {
  useEffect(() => {
    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 禁用图片拖拽
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // 禁用常用快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S, Ctrl+U, F12
      if ((e.ctrlKey && (e.key === 's' || e.key === 'u')) || e.key === 'F12') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
```

**使用方式**:
在 `page.tsx` 中调用:

```typescript
usePhotoProtection();
```

---

### 9.2 URL 安全验证

**优先级**: 🟡 中
**依赖**: 页面组件
**预计时间**: 10分钟

- [ ] 验证 Token 不在 URL 中暴露敏感信息
- [ ] Token 验证失败时清除页面数据
- [ ] 防止直接访问照片 URL

**实现要点**:

- 使用 `useEffect` 清除错误状态
- Token 验证失败不存储到 localStorage
- 照片 URL 使用签名 URL（R2 私有访问）

---

## 🎯 API 路由汇总

### Viewer API

```
GET    /api/viewer/:token               获取选片信息
POST   /api/viewer/:token/photos/:id/toggle  切换选择
GET    /api/viewer/:token/selection     获取已选照片
POST   /api/viewer/:token/submit        提交选片
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有页面都已实现（Viewer主页面、错误页面、成功页面）
- [ ] 所有交互功能正常（标记、切换、提交）
- [ ] Token 验证机制正常（无效、过期、撤销）
- [ ] 键盘快捷键正常工作
- [ ] 移动端触摸操作正常

### 用户体验

- [ ] 页面加载快速（首屏 < 2秒）
- [ ] 操作响应及时（标记照片 < 100ms）
- [ ] 界面简洁美观（黑色背景，突出照片）
- [ ] 移动端体验良好（按钮大小、触摸响应）

### 性能要求

- [ ] 100张照片加载时间 < 3秒
- [ ] 标记照片响应 < 100ms
- [ ] 切换照片无卡顿（60fps）
- [ ] 虚拟滚动正常（200+ 照片）

### 安全要求

- [ ] 无效 Token 显示友好错误
- [ ] 过期 Token 显示友好错误
- [ ] 无法通过 URL 直接访问原图（使用 R2 私有访问）
- [ ] 右键菜单禁用
- [ ] 图片拖拽禁用

---

## 🎨 UI 设计规范

### 设计原则

- **极简主义**: 黑色背景，突出照片
- **沉浸式体验**: 隐藏多余元素，专注浏览
- **大按钮优先**: 移动端友好的按钮尺寸（最小 44x44px）
- **即时反馈**: 点击立即有视觉反馈（过渡动画）

### 颜色方案

```css
/* 背景色 */
--bg-primary: #000000; /* 主背景 */
--bg-secondary: #111111; /* 次级背景 */
--bg-tertiary: #1a1a1a; /* 三级背景 */

/* 文字色 */
--text-primary: #ffffff; /* 主文字 */
--text-secondary: #a3a3a3; /* 次级文字 */
--text-tertiary: #737373; /* 三级文字 */

/* 强调色 */
--accent-primary: #2563eb; /* 蓝色（链接、按钮） */
--accent-success: #22c55e; /* 绿色（成功） */
--accent-error: #ef4444; /* 红色（错误） */

/* 选中标记 */
--selected-ring: #2563eb; /* 蓝色边框 */
--selected-bg: #2563eb; /* 蓝色背景 */
```

### 组件样式规范

```css
/* 照片卡片 */
.photo-card {
  @apply relative aspect-square overflow-hidden rounded-lg cursor-pointer;
  @apply transition-all duration-200;
  @apply hover:scale-[1.02] active:scale-[0.98];
}

.photo-card.selected {
  @apply ring-4 ring-blue-600;
}

/* 大图查看器 */
.lightbox {
  @apply fixed inset-0 bg-black/95 flex items-center justify-center z-50;
}

/* 按钮 */
.btn-primary {
  @apply px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg;
  @apply font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 输入框 */
.input {
  @apply px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg;
  @apply text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600;
}
```

---

## 🧪 测试清单

### 功能测试

- [ ] Token 验证正常（有效、无效、过期、撤销）
- [ ] 照片加载正常（缩略图、预览图、原图）
- [ ] 标记功能正常（点击、键盘空格）
- [ ] 选片统计准确（实时更新）
- [ ] 提交流程正常（确认、成功、锁定）
- [ ] 提交后无法继续操作

### 键盘操作测试

- [ ] 方向键切换照片（← →）
- [ ] 空格键标记照片
- [ ] ESC 关闭大图/对话框
- [ ] Enter 提交选片（如果实现了）

### 性能测试

- [ ] 100张照片加载流畅（< 3秒）
- [ ] 虚拟滚动正常（200+ 照片）
- [ ] 图片懒加载正常
- [ ] 切换照片无卡顿（60fps）

### 兼容性测试

- [ ] Chrome 最新版正常
- [ ] Safari 最新版正常
- [ ] Firefox 最新版正常
- [ ] 移动端浏览器正常
- [ ] 触摸操作正常（滑动、点击）

### 安全测试

- [ ] 无效 Token 显示错误页面
- [ ] 过期 Token 显示错误页面
- [ ] 无法通过 URL 直接访问原图
- [ ] 右键菜单禁用
- [ ] 图片无法拖拽保存

---

## 📝 相关文档

- [后端实现](./02-backend-implementation.md) | 前置依赖
- [管理后台UI](./03-admin-ui.md) | 管理端界面
- [端到端测试](./05-testing.md) | 下一步：完整测试

---

**最后更新**: 2026-01-04
**状态**: 📝 已重构为任务清单格式
