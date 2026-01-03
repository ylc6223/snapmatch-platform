"use client";

import React from 'react';
import { Edit3, Eye, Download, Star, MoreHorizontal } from 'lucide-react';
import { Photo, PhotoStatus } from '../types';

interface PhotoViewsProps {
  photos: Photo[];
  onEdit: (photo: Photo) => void;
}

/** 状态徽章组件 - Pill形状 */
const StatusBadge: React.FC<{ status: PhotoStatus }> = ({ status }) => {
  const styles = {
    [PhotoStatus.PUBLISHED]: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    [PhotoStatus.DRAFT]: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
    [PhotoStatus.ARCHIVED]: 'bg-muted text-muted-foreground',
  };

  const labels = {
    [PhotoStatus.PUBLISHED]: '已发布',
    [PhotoStatus.DRAFT]: '草稿',
    [PhotoStatus.ARCHIVED]: '已归档',
  };

  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

/**
 * GridView - 网格视图
 * Masonry瀑布流布局，hover时显示编辑操作
 */
export const GridView: React.FC<PhotoViewsProps> = ({ photos, onEdit }) => {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative break-inside-avoid cursor-pointer"
          onClick={() => onEdit(photo)}
        >
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-auto object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />

            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className={`p-2 rounded-full backdrop-blur-md ${photo.isFavorite ? 'bg-amber-400 text-white' : 'bg-black/30 text-white'}`}>
                  <Star size={14} fill={photo.isFavorite ? "currentColor" : "none"} />
               </div>
            </div>

            {/* 极简悬停覆盖层 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-white text-lg font-bold tracking-wide">{photo.title}</h3>
                  <StatusBadge status={photo.status} />
                </div>
                <div className="flex items-center gap-3 text-white/60 text-xs uppercase tracking-widest font-medium">
                  <span>{photo.category}</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                  <span>{photo.dimension}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all backdrop-blur-md" title="编辑">
                        <Edit3 size={16} />
                    </button>
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all backdrop-blur-md" title="下载">
                        <Download size={16} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ListView - 列表视图
 * 响应式设计，移动端和桌面端布局不同
 */
export const ListView: React.FC<PhotoViewsProps> = ({ photos, onEdit }) => {
  return (
    <div className="space-y-3 pb-20">
      {/* 表头（桌面端可见）- Sticky & 无边框 */}
      <div className="hidden md:flex items-center px-6 py-4 mb-2 text-xs font-black text-foreground/80 uppercase tracking-widest sticky top-24 z-20 bg-background/80 backdrop-blur-xl transition-all duration-300">
         <div className="w-24">封面</div>
         <div className="flex-1 min-w-[200px]">作品标题</div>
         <div className="w-32">分类</div>
         <div className="w-48">标签</div>
         <div className="w-32">状态</div>
         <div className="w-24 text-center">推荐</div>
         <div className="w-32 text-right">更新时间</div>
         <div className="w-16"></div>
      </div>

      {photos.map((photo) => (
        <div
          key={photo.id}
          onClick={() => onEdit(photo)}
          className="group flex items-start md:items-center gap-3 md:gap-4 p-3 rounded-2xl bg-card/60 hover:bg-card transition-all duration-300 cursor-pointer border border-transparent hover:border-border hover:shadow-lg hover:shadow-primary/5"
        >
          {/* 缩略图 - 响应式尺寸 */}
          <div className="flex-shrink-0">
            <div className="h-20 w-20 md:h-14 md:w-24 overflow-hidden rounded-xl md:rounded-lg shadow-sm bg-muted">
                <img
                className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                src={photo.url}
                alt=""
                loading="lazy"
                />
            </div>
          </div>

          {/* 移动端内容布局（< md 可见） */}
          <div className="flex-1 md:hidden flex flex-col justify-between h-20 py-0.5">
             <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{photo.title}</h3>
                <StatusBadge status={photo.status} />
             </div>

             <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>{photo.category}</span>
                <span className="w-0.5 h-0.5 bg-border rounded-full"></span>
                <span className="font-mono">{photo.date}</span>
             </div>

             <div className="flex flex-wrap gap-1.5 mt-auto">
                {photo.tags.slice(0, 2).map(tag => (
                     <span key={tag} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded uppercase tracking-wide border border-border/50">
                        {tag}
                     </span>
                 ))}
                 {photo.tags.length > 2 && (
                     <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded border border-border/50">+{photo.tags.length - 2}</span>
                 )}
             </div>
          </div>

          {/* 桌面端内容布局（< md 隐藏）- 列布局 */}
          {/* 标题 - Flex 1 */}
          <div className="hidden md:flex flex-1 min-w-[200px] flex-col justify-center">
             <h3 className="text-base font-bold text-foreground truncate">{photo.title}</h3>
          </div>

          {/* 分类 */}
          <div className="hidden md:flex md:w-32 items-center">
             <span className="text-sm font-medium text-muted-foreground">{photo.category}</span>
          </div>

          {/* 标签 */}
          <div className="hidden md:flex md:w-48 flex-wrap gap-1.5">
             {photo.tags.slice(0, 2).map(tag => (
                 <span key={tag} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-md uppercase tracking-wide border border-border">
                    {tag}
                 </span>
             ))}
             {photo.tags.length > 2 && (
                 <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-md border border-border">+{photo.tags.length - 2}</span>
             )}
          </div>

          {/* 状态 */}
          <div className="hidden md:flex md:w-32 items-center">
             <StatusBadge status={photo.status} />
          </div>

          {/* 推荐（星标） */}
          <div className="hidden md:flex w-24 justify-center">
             <div className={`transition-colors ${photo.isFavorite ? 'text-amber-400' : 'text-muted-foreground/30'}`}>
                <Star size={16} fill={photo.isFavorite ? "currentColor" : "none"} />
             </div>
          </div>

          {/* 日期 */}
          <div className="hidden md:flex w-32 justify-end">
             <span className="text-sm font-mono text-muted-foreground">{photo.date}</span>
          </div>

          {/* 操作 */}
          <div className="hidden md:flex w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                  <MoreHorizontal size={18} />
              </button>
          </div>
        </div>
      ))}
    </div>
  );
};
