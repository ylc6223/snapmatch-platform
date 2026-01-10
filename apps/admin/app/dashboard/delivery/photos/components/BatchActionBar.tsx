'use client';

import { Trash2, FolderOpen, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onUpdateCategory: () => void;
  onAddTags: () => void;
  onRemoveTags: () => void;
  className?: string;
}

export function BatchActionBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onUpdateCategory,
  onAddTags,
  onRemoveTags,
  className,
}: BatchActionBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 shadow-lg ${className}`}
      >
        <span className="text-sm font-medium text-white">
          已选择 {selectedCount} 张照片
        </span>

        <div className="h-4 w-px bg-gray-700" />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-white hover:bg-gray-800"
          onClick={onUpdateCategory}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          修改类目
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-white hover:bg-gray-800"
          onClick={onAddTags}
        >
          <Tag className="mr-2 h-4 w-4" />
          添加标签
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-white hover:bg-gray-800"
          onClick={onRemoveTags}
        >
          <Tag className="mr-2 h-4 w-4" />
          移除标签
        </Button>

        <div className="h-4 w-px bg-gray-700" />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-red-400 hover:bg-red-950 hover:text-red-300"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-gray-800"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除照片</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedCount} 张照片吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
