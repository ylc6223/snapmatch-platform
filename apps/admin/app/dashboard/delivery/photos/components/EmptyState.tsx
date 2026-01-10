'use client';

import { ImageIcon } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = '暂无照片',
  description = '该筛选条件下没有找到照片',
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
