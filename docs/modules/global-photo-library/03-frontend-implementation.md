# 全局照片库 - 前端实现指南

> **技术栈**: Next.js 15 + React Query + Zustand + Shadcn UI + TanStack Virtual
> **最后更新**: 2026-01-10

---

## 📋 组件架构

### 目录结构

```
apps/admin/app/dashboard/delivery/photos/
├── page.tsx                                    # 主页面
├── components/
│   ├── PhotoGrid.tsx                           # 照片网格（虚拟列表）
│   ├── PhotoCard.tsx                           # 单张照片卡片
│   ├── FilterBar.tsx                           # 筛选器（类目+标签）
│   ├── SearchBar.tsx                           # 搜索栏
│   ├── BatchActionBar.tsx                      # 批量操作工具栏
│   ├── PhotoDetailDrawer.tsx                   # 照片详情抽屉
│   └── EmptyState.tsx                          # 空状态组件
└── hooks/
    ├── usePhotos.ts                            # 照片列表 Hook
    ├── usePhotoSearch.ts                       # 搜索 Hook
    ├── usePhotoBatchOperations.ts              # 批量操作 Hook
    └── usePhotoSelection.ts                    # 照片选择状态管理
```

---

## 🎨 主页面实现

### page.tsx

```typescript
'use client';

import React, { useState } from 'react';
import { PhotoGrid } from './components/PhotoGrid';
import { FilterBar } from './components/FilterBar';
import { SearchBar } from './components/SearchBar';
import { BatchActionBar } from './components/BatchActionBar';
import { PhotoDetailDrawer } from './components/PhotoDetailDrawer';
import { usePhotoSelection } from './hooks/usePhotoSelection';
import { usePhotos } from './hooks/usePhotos';

export default function GlobalPhotoLibraryPage() {
  const [filters, setFilters] = useState({
    category: undefined as string | undefined,
    tags: [] as string[]
  });

  const [search, setSearch] = useState({
    keyword: '',
    fields: ['filename', 'projectName', 'customerName', 'tagName']
  });

  const { data, loading, error, refetch } = usePhotos({
    category: filters.category,
    tags: filters.tags
  });

  const {
    selectedPhotos,
    togglePhotoSelection,
    clearSelection,
    selectAll,
    isAllSelected
  } = usePhotoSelection(data || []);

  const [selectedPhotoForDetail, setSelectedPhotoForDetail] = useState<Photo | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部：搜索和筛选 */}
      <div className="shrink-0 border-b border-border bg-card">
        <SearchBar
          value={search.keyword}
          onChange={(keyword) => setSearch({ ...search, keyword })}
          onSearch={() => refetch()}
        />

        <FilterBar
          category={filters.category}
          tags={filters.tags}
          onCategoryChange={(category) => setFilters({ ...filters, category })}
          onTagsChange={(tags) => setFilters({ ...filters, tags })}
        />
      </div>

      {/* 主内容：照片网格 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <PhotoGridSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data && data.length > 0 ? (
          <PhotoGrid
            photos={data}
            selectedPhotos={selectedPhotos}
            onToggleSelection={togglePhotoSelection}
            onPhotoClick={(photo) => setSelectedPhotoForDetail(photo)}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 批量操作工具栏（有选中时显示） */}
      {selectedPhotos.length > 0 && (
        <BatchActionBar
          selectedCount={selectedPhotos.length}
          onClear={clearSelection}
          onSelectAll={() => selectAll(data || [])}
          isAllSelected={isAllSelected(data || [])}
          onBatchDelete={async () => {
            await handleBatchDelete(selectedPhotos);
            clearSelection();
            refetch();
          }}
          onBatchUpdateCategory={async (categoryId) => {
            await handleBatchUpdateCategory(selectedPhotos, categoryId);
            clearSelection();
            refetch();
          }}
          onBatchAddTags={async (tagIds) => {
            await handleBatchAddTags(selectedPhotos, tagIds);
            clearSelection();
            refetch();
          }}
          onBatchRemoveTags={async (tagIds) => {
            await handleBatchRemoveTags(selectedPhotos, tagIds);
            clearSelection();
            refetch();
          }}
        />
      )}

      {/* 照片详情抽屉 */}
      {selectedPhotoForDetail && (
        <PhotoDetailDrawer
          photo={selectedPhotoForDetail}
          isOpen={!!selectedPhotoForDetail}
          onClose={() => setSelectedPhotoForDetail(null)}
          onUpdate={() => {
            setSelectedPhotoForDetail(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
```

---

## 🖼️ PhotoGrid 组件（虚拟列表）

### 核心实现

```typescript
'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PhotoCard } from './PhotoCard';
import { Photo } from '@/types';

interface PhotoGridProps {
  photos: Photo[];
  selectedPhotos: Set<string>;
  onToggleSelection: (photoId: string) => void;
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onToggleSelection,
  onPhotoClick
}: PhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 虚拟列表配置
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(photos.length / 4), // 假设每行4张照片
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // 每行高度200px
    overscan: 5 // 预渲染5行
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * 4;
          const endIndex = Math.min(startIndex + 4, photos.length);
          const rowPhotos = photos.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
              className="grid grid-cols-4 gap-4 px-6 py-4"
            >
              {rowPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={selectedPhotos.has(photo.id)}
                  onToggleSelection={() => onToggleSelection(photo.id)}
                  onClick={() => onPhotoClick(photo)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🎴 PhotoCard 组件

### 核心实现

```typescript
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onToggleSelection: () => void;
  onClick: () => void;
}

export function PhotoCard({ photo, isSelected, onToggleSelection, onClick }: PhotoCardProps) {
  const [loadOriginal, setLoadOriginal] = useState(false);

  return (
    <div
      className={cn(
        'relative aspect-square group overflow-hidden rounded-lg border-2 cursor-pointer transition-all',
        isSelected ? 'border-primary' : 'border-transparent hover:border-border'
      )}
      onClick={onClick}
    >
      {/* 缩略图/原图 */}
      <Image
        src={loadOriginal ? photo.previewKey : photo.thumbKey}
        alt={photo.filename}
        fill
        className="object-cover"
        loading="lazy"
        onLoad={() => setLoadOriginal(true)}
      />

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check size={14} className="text-primary-foreground" />
        </div>
      )}

      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white p-4">
          {/* 项目信息 */}
          <div className="text-center">
            <p className="text-sm font-bold truncate">{photo.projectName}</p>
            <p className="text-xs opacity-80">{photo.customerName}</p>
          </div>

          {/* 选择按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/20 backdrop-blur hover:bg-white/30'
            )}
          >
            {isSelected ? '已选中' : '选择'}
          </button>
        </div>
      </div>

      {/* 类目标签 */}
      {photo.categoryName && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-white text-xs">
          {photo.categoryName}
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 FilterBar 组件

### 核心实现

```typescript
'use client';

import React from 'react';
import { FilterBar as UiFilterBar } from '@/components/ui/filter-bar';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { TagGroup } from '@/types';

interface FilterBarProps {
  category?: string;
  tags: string[];
  onCategoryChange: (category: string | undefined) => void;
  onTagsChange: (tags: string[]) => void;
}

export function FilterBar({
  category,
  tags,
  onCategoryChange,
  onTagsChange
}: FilterBarProps) {
  const { data: categories } = useCategories();
  const { data: allTags } = useTags();

  // 标签分组
  const tagGroups: Record<TagGroup, typeof allTags> = {
    style: allTags?.filter(t => t.group === 'style') || [],
    emotion: allTags?.filter(t => t.group === 'emotion') || [],
    scene: allTags?.filter(t => t.group === 'scene') || [],
    people: allTags?.filter(t => t.group === 'people') || [],
    clothing: allTags?.filter(t => t.group === 'clothing') || [],
    service: allTags?.filter(t => t.group === 'service') || [],
    time: allTags?.filter(t => t.group === 'time') || []
  };

  return (
    <UiFilterBar
      categories={categories || []}
      selectedCategory={category}
      onCategoryChange={onCategoryChange}
      tagGroups={tagGroups}
      selectedTags={tags}
      onTagsChange={onTagsChange}
    />
  );
}
```

---

## 🎯 usePhotos Hook

### 核心实现

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi } from '@/lib/api/photos';
import type { PhotoQuery, Photo } from '@/types';

export function usePhotos(query?: PhotoQuery) {
  const queryClient = useQueryClient();

  // 查询照片列表
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['photos', query],
    queryFn: () => photosApi.findAll(query),
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    cacheTime: 10 * 60 * 1000, // 缓存10分钟
  });

  // 更新照片
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Photo> }) => photosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });

  // 删除照片
  const deleteMutation = useMutation({
    mutationFn: (id: string) => photosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });

  return {
    data: data?.data || [],
    meta: data?.meta,
    loading: isLoading,
    error,
    refetch,
    updatePhoto: updateMutation.mutate,
    deletePhoto: deleteMutation.mutate,
  };
}
```

---

## 🔄 usePhotoSelection Hook

### 核心实现

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Photo } from '@/types';

interface PhotoSelectionState {
  selectedPhotos: Set<string>;
  togglePhotoSelection: (photoId: string) => void;
  clearSelection: () => void;
  selectAll: (photos: Photo[]) => void;
  isAllSelected: (photos: Photo[]) => boolean;
}

export const usePhotoSelection = create<PhotoSelectionState>()(
  persist(
    (set, get) => ({
      selectedPhotos: new Set<string>(),

      togglePhotoSelection: (photoId: string) => {
        set((state) => {
          const newSet = new Set(state.selectedPhotos);
          if (newSet.has(photoId)) {
            newSet.delete(photoId);
          } else {
            newSet.add(photoId);
          }
          return { selectedPhotos: newSet };
        });
      },

      clearSelection: () => {
        set({ selectedPhotos: new Set() });
      },

      selectAll: (photos: Photo[]) => {
        set({ selectedPhotos: new Set(photos.map((p) => p.id)) });
      },

      isAllSelected: (photos: Photo[]) => {
        const { selectedPhotos } = get();
        return photos.length > 0 && photos.every((p) => selectedPhotos.has(p.id));
      },
    }),
    {
      name: 'photo-selection-storage',
      partialize: (state) => ({
        selectedPhotos: Array.from(state.selectedPhotos),
      }),
    },
  ),
);
```

---

## 📤 BatchActionBar 组件

### 核心实现

```typescript
'use client';

import React from 'react';
import { Trash2, Tag, FolderOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';

interface BatchActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onBatchDelete: () => Promise<void>;
  onBatchUpdateCategory: (categoryId: string) => Promise<void>;
  onBatchAddTags: (tagIds: string[]) => Promise<void>;
  onBatchRemoveTags: (tagIds: string[]) => Promise<void>;
}

export function BatchActionBar({
  selectedCount,
  onClear,
  onSelectAll,
  isAllSelected,
  onBatchDelete,
  onBatchUpdateCategory,
  onBatchAddTags,
  onBatchRemoveTags
}: BatchActionBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      {/* 固定底部工具栏 */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            已选 {selectedCount} 张
          </Badge>

          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            {isAllSelected ? '取消全选' : '全选'}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClear}>
            <X size={14} className="mr-1" />
            清空
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 修改类目 */}
          <CategorySelectButton onSelect={onBatchUpdateCategory} />

          {/* 添加标签 */}
          <TagSelectButton mode="add" onSelect={onBatchAddTags} />

          {/* 移除标签 */}
          <TagSelectButton mode="remove" onSelect={onBatchRemoveTags} />

          {/* 删除 */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={14} className="mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除照片</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除选中的 {selectedCount} 张照片吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onBatchDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// 类目选择按钮
function CategorySelectButton({ onSelect }: { onSelect: (categoryId: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategories();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen size={14} className="mr-1" />
          修改类目
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {categories?.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={async () => {
              await onSelect(category.id);
              setOpen(false);
            }}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 标签选择按钮
function TagSelectButton({
  mode,
  onSelect
}: {
  mode: 'add' | 'remove';
  onSelect: (tagIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { data: tags } = useTags();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag size={14} className="mr-1" />
          {mode === 'add' ? '添加标签' : '移除标签'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {tags?.map((tag) => (
          <DropdownMenuItem
            key={tag.id}
            onClick={async () => {
              await onSelect([tag.id]);
              setOpen(false);
            }}
          >
            {tag.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 🗂️ PhotoDetailDrawer 组件

### 核心实现

```typescript
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, FileImage, Calendar, User, FolderOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Photo } from '@/types';
import { Badge } from '@/components/ui/badge';

interface PhotoDetailDrawerProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PhotoDetailDrawer({
  photo,
  isOpen,
  onClose,
  onUpdate
}: PhotoDetailDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [categoryId, setCategoryId] = useState(photo.categoryId);
  const [tagIds, setTagIds] = useState(photo.tags?.map(t => t.id) || []);

  const { data: categories } = useCategories();
  const { data: allTags } = useTags();

  const handleSave = async () => {
    await updatePhoto(photo.id, { categoryId, tagIds });
    onUpdate();
    setEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>照片详情</DialogTitle>
        </DialogHeader>

        <div className="flex h-full gap-6">
          {/* 左侧：大图 */}
          <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
            <Image
              src={photo.originalKey}
              alt={photo.filename}
              fill
              className="object-contain"
            />
          </div>

          {/* 右侧：元数据 */}
          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            {/* 文件信息 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileImage size={14} />
                文件名
              </Label>
              <Input value={photo.filename} disabled />
            </div>

            {/* 尺寸信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>宽度</Label>
                <Input value={`${photo.width}px`} disabled />
              </div>
              <div className="space-y-2">
                <Label>高度</Label>
                <Input value={`${photo.height}px`} disabled />
              </div>
            </div>

            {/* 文件大小 */}
            <div className="space-y-2">
              <Label>文件大小</Label>
              <Input value={`${(photo.fileSize / 1024 / 1024).toFixed(2)} MB`} disabled />
            </div>

            {/* 项目信息 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen size={14} />
                项目
              </Label>
              <Input value={photo.projectName} disabled />
            </div>

            {/* 客户信息 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User size={14} />
                客户
              </Label>
              <Input value={photo.customerName} disabled />
            </div>

            {/* 创建时间 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar size={14} />
                上传时间
              </Label>
              <Input
                value={new Date(photo.createdAt).toLocaleString('zh-CN')}
                disabled
              />
            </div>

            {/* 类目（可编辑） */}
            {editing ? (
              <div className="space-y-2">
                <Label>类目</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">未分类</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>类目</Label>
                <Badge variant="secondary">{photo.categoryName || '未分类'}</Badge>
              </div>
            )}

            {/* 标签（可编辑） */}
            {editing ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag size={14} />
                  标签
                </Label>
                <div className="flex flex-wrap gap-2">
                  {allTags?.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={tagIds.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (tagIds.includes(tag.id)) {
                          setTagIds(tagIds.filter(id => id !== tag.id));
                        } else {
                          setTagIds([...tagIds, tag.id]);
                        }
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag size={14} />
                  标签
                </Label>
                <div className="flex flex-wrap gap-2">
                  {photo.tags?.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-auto">
              {editing ? (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    保存
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditing(true)} className="flex-1">
                    编辑
                  </Button>
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    关闭
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ 性能优化清单

### 1. 虚拟列表

- ✅ 使用 `@tanstack/react-virtual`
- ✅ 只渲染可见区域的照片
- ✅ 预渲染5行（overscan: 5）

### 2. 图片懒加载

- ✅ 使用 `loading="lazy"`
- ✅ 缩略图优先加载
- ✅ 点击详情时加载原图

### 3. 查询缓存

- ✅ 使用 React Query 缓存
- ✅ staleTime: 5分钟
- ✅ cacheTime: 10分钟

### 4. 组件优化

- ✅ 使用 `React.memo` 优化 PhotoCard
- ✅ 使用 `useCallback` 传递回调函数
- ✅ 避免不必要的重渲染

### 5. 防抖搜索

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback((keyword) => {
  searchPhotos(keyword);
}, 300);
```

---

**维护者**: 开发团队
**最后更新**: 2026-01-10
