'use client';

import { SlidersHorizontal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  categories?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  tags?: FilterOption[];
  selectedTags?: string[];
  onTagToggle?: (tagId: string) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

export function FilterBar({
  categories = [],
  selectedCategory,
  onCategoryChange,
  tags = [],
  selectedTags = [],
  onTagToggle,
  isSidebarOpen = false,
  onToggleSidebar,
  className,
}: FilterBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={cn(
        'sticky top-[3.75rem] z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 px-6 flex items-center gap-4',
        className
      )}
    >
      <Button
        variant="outline"
        className={cn(
          'rounded-full gap-2 px-5 h-10 border-border text-muted-foreground font-medium hover:text-foreground transition-all',
          isSidebarOpen && 'bg-foreground text-background hover:bg-muted hover:text-foreground border-foreground'
        )}
        onClick={onToggleSidebar}
      >
        <SlidersHorizontal className="w-4 h-4" />
        筛选
      </Button>

      <div className="h-8 w-px bg-border shrink-0" />

      {/* Categories as rounded pills */}
      <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-hide">
        <button
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
            !selectedCategory
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
          )}
          onClick={() => onCategoryChange?.('')}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
              selectedCategory === category.id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
            )}
            onClick={() => onCategoryChange?.(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Tags horizontal scroll */}
      <div className="relative flex-1 min-w-0 group">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-hide no-scrollbar scroll-smooth pr-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
                  isSelected
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
                )}
                onClick={() => onTagToggle?.(tag.id)}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Gradient Mask & Scroll Button */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pointer-events-none group-hover:pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background shadow-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={scrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
