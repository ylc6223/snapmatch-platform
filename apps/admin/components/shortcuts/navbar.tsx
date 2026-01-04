"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchInput, SearchResult } from '@/components/ui/search-input';
import { toast } from 'sonner';

export function Navbar() {
  const router = useRouter();

  const handleSearchSelect = (item: SearchResult) => {
    // 显示选中的项目信息
    toast.success(`已选择项目: ${item.name}`, {
      description: `客户: ${item.customerName || '未知'} | 状态: ${item.status}`,
      action: {
        label: '查看项目',
        onClick: () => {
          // TODO: 跳转到项目详情页
          // router.push(`/dashboard/projects/${item.id}`);
          console.log('跳转到项目:', item.id);
        },
      },
    });

    console.log('选中的项目:', item);
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background sticky top-0 z-50 border-b border-border">
      {/* Left: Logo placeholder */}
      <div className="w-40"></div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8">
        <SearchInput
          placeholder="搜索项目、客户或照片..."
          onSelect={handleSearchSelect}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Button className="rounded-md px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus size={16} />
          <span>新建项目</span>
        </Button>
      </div>
    </nav>
  );
}
