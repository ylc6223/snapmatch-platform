"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FilterBar } from '@/components/shortcuts/filter-bar';
import { ProjectGrid } from '@/components/shortcuts/project-grid';

export default function Page() {
  const [activeFilter, setActiveFilter] = React.useState('全部');
  const [sortBy, setSortBy] = React.useState<'createdAt' | '-createdAt'>('-createdAt');

  return (
    <div className="min-h-screen font-sans text-foreground bg-background">
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 px-1">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          工作台
        </Link>
        <ChevronRight size={16} />
        <Link href="/dashboard/delivery" className="hover:text-foreground transition-colors">
          交付管理
        </Link>
        <ChevronRight size={16} />
        <span className="text-foreground font-medium">项目管理</span>
      </nav>

      {/* 页面标题 */}
      <div className="mb-8 px-1">
        <h1 className="text-3xl font-bold text-foreground mb-2">项目管理</h1>
        <p className="text-sm text-muted-foreground">
          管理所有摄影项目，包括照片上传、选片进度等
        </p>
      </div>

      {/* 筛选工具栏 */}
      <div>
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
    </div>
  );
}
