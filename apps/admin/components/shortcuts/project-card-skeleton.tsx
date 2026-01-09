import React from 'react';

/**
 * ProjectCardSkeleton - 项目卡片骨架屏
 * 与 ProjectCard 保持相同的布局和尺寸
 */
export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Image Area Skeleton */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted border border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      </div>

      {/* Content Area Skeleton */}
      <div className="flex flex-col px-0.5">
        {/* Title Skeleton */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="h-5 bg-muted rounded-md w-3/4 animate-pulse" />
        </div>

        {/* Meta Info Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3 bg-muted rounded-md w-16 animate-pulse" />
          <div className="h-3 w-1.5 rounded-full bg-muted animate-pulse" />
          <div className="h-3 bg-muted rounded-md w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
