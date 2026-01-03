"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, X, Check, RefreshCw } from 'lucide-react';
import { ViewMode } from '../types';
import { MOCK_PHOTOS, CATEGORIES, STATUS_FILTERS } from '../constants';

interface FilterBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// Shadcn风格的无边框输入框
const FramelessInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-full w-full bg-transparent px-3 py-1 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
FramelessInput.displayName = "FramelessInput"

/**
 * FilterBar - 顶部浮动筛选栏
 * 特点：毛玻璃效果、弹性动画、响应式设计
 */
export const FilterBar: React.FC<FilterBarProps> = ({ viewMode, setViewMode }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeStatus, setActiveStatus] = useState('全部状态');
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭筛选弹窗
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchIconClick = () => {
    inputRef.current?.focus();
    setIsSearchFocused(true);
    setIsFilterOpen(false);
  };

  const toggleFilter = () => {
    const newState = !isFilterOpen;
    if (newState) {
      setIsSearchFocused(false);
    }
    setIsFilterOpen(newState);
  };

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布': return 'bg-emerald-500';
      case '草稿': return 'bg-amber-500';
      case '已归档': return 'bg-slate-500';
      default: return 'bg-foreground/30';
    }
  };

  const isExpanded = isSearchFocused || isFilterOpen;

  return (
    <div className="fixed top-4 md:top-6 left-0 right-0 z-30 flex justify-center pointer-events-none px-4" ref={filterRef}>
      <div className="relative pointer-events-auto max-w-full">

        {/* 主栏容器 */}
        <div className={`
            flex items-center gap-1 md:gap-2 p-1.5 md:p-2 rounded-full border border-border/60
            transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
            ${isExpanded
                ? 'bg-card shadow-2xl shadow-primary/10 translate-y-1 w-[calc(100vw-32px)] md:w-auto justify-between delay-0'
                : 'bg-card/80 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 w-auto delay-300'
            }
            z-40 relative
        `}>

          {/* 搜索框 */}
          <div
            className={`
                flex items-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${isSearchFocused
                    ? 'flex-1 md:w-[500px] bg-muted ring-2 ring-primary/10 h-10 px-3'
                    : 'w-10 h-10 md:w-64 bg-transparent md:bg-muted/50 hover:bg-muted/80 justify-center md:justify-start md:px-4'
                }
            `}
            onClick={handleSearchIconClick}
          >
            <Search
                className={`
                    shrink-0 h-4 w-4 transition-colors duration-300
                    ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}
                `}
            />

            {/* 输入框：移动端未聚焦时隐藏，聚焦时显示 */}
            <FramelessInput
                ref={inputRef}
                placeholder="搜索..."
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`ml-1 ${isSearchFocused ? 'block' : 'hidden md:block'}`}
            />

            {/* 关闭图标（移动端聚焦时显示） */}
            {isSearchFocused && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsSearchFocused(false); inputRef.current?.blur(); }}
                    className="md:hidden p-1 text-muted-foreground"
                >
                    <X size={14} />
                </button>
            )}
          </div>

          {/* 分隔线 - 搜索聚焦时在移动端隐藏 */}
          <div className={`w-px h-6 bg-border mx-0.5 md:mx-1 transition-opacity duration-300 ${isSearchFocused ? 'hidden md:block' : 'block'}`} />

          {/* 筛选切换按钮 */}
          <button
            onClick={toggleFilter}
            className={`
                h-10 w-10 flex items-center justify-center rounded-full transition-all duration-300 relative shrink-0
                ${isFilterOpen
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
                ${isSearchFocused ? 'hidden md:flex' : 'flex'}
            `}
            title="筛选"
          >
              <SlidersHorizontal size={18} />
              {(activeCategory !== '全部' || activeStatus !== '全部状态') && !isFilterOpen && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full border-2 border-background"></span>
              )}
          </button>

          {/* 分隔线 */}
          <div className={`w-px h-6 bg-border mx-0.5 md:mx-1 shrink-0 ${isSearchFocused ? 'hidden md:block' : 'hidden lg:block'}`} />

          {/* 计数徽章 */}
          <div className={`
              hidden lg:flex items-center px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 transition-opacity duration-300
              ${isSearchFocused ? 'opacity-50' : 'opacity-100'}
          `}>
             共 {MOCK_PHOTOS.length} 个作品
          </div>

          <div className={`hidden lg:block w-px h-6 bg-border mx-1 shrink-0 ${isSearchFocused ? 'hidden md:block' : 'block'}`} />

          {/* 视图切换 */}
          <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={`
                h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all duration-300 transform active:scale-95 shrink-0
                ${isSearchFocused ? 'hidden md:flex' : 'flex'}
              `}
              title={viewMode === 'grid' ? "切换到列表视图" : "切换到网格视图"}
          >
              {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
          </button>

          <div className={`w-px h-6 bg-border mx-0.5 md:mx-1 shrink-0 ${isSearchFocused ? 'hidden md:block' : 'block'}`} />

          {/* 用户头像 */}
          <button className={`
            items-center gap-3 pl-1 pr-1 py-1 rounded-full hover:bg-muted/50 transition-colors shrink-0
            ${isSearchFocused ? 'hidden md:flex' : 'flex'}
          `}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>

        {/* 浮动筛选弹窗 */}
        <div
            className={`
                absolute top-[calc(100%+16px)]
                left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0
                w-[calc(100vw-32px)] md:w-full
                bg-card/95 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-2xl shadow-black/10 overflow-hidden
                transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) origin-top
                ${isFilterOpen ? 'opacity-100 scale-100 translate-y-0 delay-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none delay-0'}
            `}
        >
            <div className="p-8 space-y-8">
                {/* 分类部分 - Pill风格 */}
                <div>
                    <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest mb-4 select-none">
                        作品分类
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                                    activeCategory === cat
                                    ? 'bg-foreground text-background shadow-lg shadow-black/10 scale-105'
                                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 状态部分 - 卡片/圆点风格 */}
                <div>
                    <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest mb-4 select-none">
                        状态筛选
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {STATUS_FILTERS.map(status => {
                            const isActive = activeStatus === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setActiveStatus(status)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border
                                        ${isActive
                                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20'
                                            : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(status)} shadow-sm`} />
                                    {status}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 操作底部栏 */}
                <div className="pt-6 border-t border-border/50 flex justify-between items-center">
                    <button
                        onClick={() => { setActiveCategory('全部'); setActiveStatus('全部状态'); }}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground/70 hover:text-foreground transition-colors px-2 py-2 rounded-lg hover:bg-muted/50"
                    >
                        <RefreshCw size={14} className={activeCategory !== '全部' || activeStatus !== '全部状态' ? 'text-foreground' : ''} />
                        重置筛选
                    </button>
                    <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wide rounded-full shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Check size={14} strokeWidth={3} />
                        确认应用
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
