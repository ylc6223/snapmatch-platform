"use client";

import React, { useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { Toolbar } from './components/Toolbar';
import { GridView, ListView } from './components/PhotoViews';
import { PhotoDrawer } from './components/PhotoDrawer';
import { MOCK_PHOTOS } from './constants';
import { ViewMode, Photo } from './types';

/**
 * 作品管理页面
 *
 * 注意：Sidebar和主题管理现在由portfolio/layout提供
 * 本页面只负责作品列表的内容区域
 */
export default function WorksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handleEdit = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedPhoto(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  return (
    <>
      {/* 浮动头部 / 筛选岛（顶部） */}
      <FilterBar viewMode={viewMode} setViewMode={setViewMode} />

      {/* 浮动操作 / 视图切换（右下角） */}
      <Toolbar onUpload={handleCreate} />

      {/* 主可滚动画布 */}
      <main className="w-full h-full overflow-y-auto scroll-smooth">
        <div className="max-w-[1800px] mx-auto px-4 md:px-24 pt-32 pb-32">

          {/* 大标题背景装饰 */}
          <div className="mb-12 relative">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground/5 uppercase select-none pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 -z-10 transition-colors duration-500 whitespace-nowrap">
              作品管理
            </h1>
          </div>

          {/* 视图切换 */}
          {viewMode === 'grid' ? (
            <GridView photos={MOCK_PHOTOS} onEdit={handleEdit} />
          ) : (
            <ListView photos={MOCK_PHOTOS} onEdit={handleEdit} />
          )}
        </div>
      </main>

      {/* 编辑抽屉覆盖层 */}
      <PhotoDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        photo={selectedPhoto}
      />
    </>
  );
}
