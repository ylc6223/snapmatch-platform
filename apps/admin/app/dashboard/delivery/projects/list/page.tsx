"use client";

import React from 'react';
import { ProjectGrid } from '@/components/shortcuts/project-grid';
import { Navbar } from '@/components/shortcuts/navbar';
import { SparklesCore } from '@/components/ui/sparkles';

export default function Page() {
  const [sortBy, setSortBy] = React.useState<'createdAt' | '-createdAt'>('-createdAt');

  return (
    <div className="min-h-screen font-sans text-foreground bg-background">
      {/* 顶部导航栏 - 包含搜索和新建项目按钮 */}
      <nav className="relative">
        <Navbar />
        {/* Sparkles 背景效果 */}
        <SparklesCore
          id="tsparticles-navbar"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={50}
          particleColor="hsl(var(--primary))"
          speed={2}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8">
        {/* 项目网格 */}
        <div className="mt-2">
          <ProjectGrid
            activeFilter="全部"
            sortBy={sortBy}
          />
        </div>
      </main>
    </div>
  );
}
