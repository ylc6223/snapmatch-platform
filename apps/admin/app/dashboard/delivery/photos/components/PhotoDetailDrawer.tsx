'use client';

import { X, Download, Calendar, User, FolderOpen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useState } from 'react';
import type { Photo, Category, Tag } from '../hooks/usePhotos';

export interface PhotoDetailDrawerProps {
  photo?: Photo;
  categories?: Category[];
  allTags?: Tag[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdate?: (photoId: string, data: Partial<Photo>) => void;
  onDelete?: (photoId: string) => void;
}

export function PhotoDetailDrawer({
  photo,
  categories = [],
  allTags = [],
  open = false,
  onOpenChange,
  onUpdate,
  onDelete,
}: PhotoDetailDrawerProps) {
  const [categoryId, setCategoryId] = useState(photo?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    photo?.tags?.map((t) => t.id) || []
  );

  const handleSave = () => {
    if (photo) {
      onUpdate?.(photo.id, {
        categoryId,
        tags: allTags.filter((t) => selectedTagIds.includes(t.id)),
      });
    }
  };

  const handleDownload = () => {
    if (photo) {
      window.open(photo.originalKey, '_blank');
    }
  };

  const groupedTags = allTags.reduce((acc, tag) => {
    if (!acc[tag.group]) {
      acc[tag.group] = [];
    }
    acc[tag.group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const tagGroupNames: Record<string, string> = {
    style: '风格',
    emotion: '情绪',
    scene: '场景',
    people: '人物关系',
    clothing: '服装',
    service: '服务属性',
    time: '时间节点',
  };

  if (!photo) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>照片详情</SheetTitle>
              <SheetDescription>{photo.filename}</SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange?.(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Image Preview */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={photo.previewKey}
              alt={photo.filename}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              下载原图
            </Button>
          </div>

          {/* Photo Info */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">文件信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">文件名</span>
                <p className="font-medium">{photo.filename}</p>
              </div>
              <div>
                <span className="text-gray-500">文件大小</span>
                <p className="font-medium">{(photo.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <span className="text-gray-500">尺寸</span>
                <p className="font-medium">
                  {photo.width} × {photo.height}
                </p>
              </div>
              <div>
                <span className="text-gray-500">上传时间</span>
                <p className="font-medium">
                  {new Date(photo.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">项目信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">项目:</span>
                <span className="font-medium">{photo.projectName || '未知项目'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">客户:</span>
                <span className="font-medium">{photo.customerName || '未知客户'}</span>
              </div>
              {photo.isProjectCover && (
                <Badge variant="secondary" className="mt-2">
                  项目封面
                </Badge>
              )}
            </div>
          </div>

          {/* Category Edit */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">类目</h3>
            <div className="space-y-2">
              <Label>选择类目</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择类目" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Edit */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">标签</h3>
            <div className="space-y-4">
              {Object.entries(groupedTags).map(([group, tags]) => (
                <div key={group}>
                  <Label className="mb-2 block">{tagGroupNames[group] || group}</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTagIds((prev) =>
                                prev.filter((id) => id !== tag.id)
                              );
                            } else {
                              setSelectedTagIds((prev) => [...prev, tag.id]);
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange?.(false)}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            保存更改
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
