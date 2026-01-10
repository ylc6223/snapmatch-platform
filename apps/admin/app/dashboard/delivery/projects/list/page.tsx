"use client";

import React from 'react';
import { FilterBar } from '@/components/shortcuts/filter-bar';
import { ProjectGrid } from '@/components/shortcuts/project-grid';
import { Navbar } from '@/components/shortcuts/navbar';

export default function Page() {
  const [activeFilter, setActiveFilter] = React.useState('全部');
  const [sortBy, setSortBy] = React.useState<'createdAt' | '-createdAt'>('-createdAt');

  return (
    <div className="min-h-screen font-sans text-foreground bg-background">
      {/* 顶部导航栏 - 包含搜索和新建项目按钮 */}
      <Navbar />

      {/* 主内容区域 */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8">
        {/* 筛选工具栏 */}
        <div className="mt-2">
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          <ProjectGrid
            activeFilter={activeFilter}
            sortBy={sortBy}
          />
        </div>
      </main>
    </div>
  );
}
