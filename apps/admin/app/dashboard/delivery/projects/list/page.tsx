"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectGrid } from '@/components/shortcuts/project-grid';
import { SearchInput, SearchResult } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { SparklesCore } from '@/components/ui/sparkles';
import { ProjectCreateDrawer } from '@/components/projects/project-create-drawer';

export default function Page() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'createdAt' | '-createdAt'>('-createdAt');

  const handleSearchSelect = (item: SearchResult) => {
    router.push(`/dashboard/projects/${item.id}`);
  };

  return (
    <div className="min-h-screen font-sans text-foreground bg-background">
      {/* 上部分：背景区域 + 搜索框 */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background border-b border-border">
        {/* Sparkles 背景效果 */}
        <SparklesCore
          id="tsparticles-hero"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={80}
          particleColor="hsl(var(--primary))"
          speed={2}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* 内容层 */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">项目管理</h1>
            <p className="text-muted-foreground">管理和查看所有摄影项目</p>
          </div>

          {/* 搜索框和操作按钮 */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 max-w-xl">
              <SearchInput
                placeholder="搜索项目、客户或照片..."
                onSelect={handleSearchSelect}
              />
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-md px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus size={16} />
              <span>新建项目</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 下部分：项目列表 */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8 py-8">
        <ProjectGrid
          activeFilter="全部"
          sortBy={sortBy}
        />
      </main>

      {/* 创建项目抽屉 */}
      <ProjectCreateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(projectId) => {
          router.push(`/dashboard/projects/${projectId}`);
        }}
      />
    </div>
  );
}
