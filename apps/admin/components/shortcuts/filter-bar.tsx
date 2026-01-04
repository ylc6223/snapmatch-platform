import React from 'react';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');

  const filters = ['全部', '进行中', '选片中', '修图中', '已交付'];

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 py-6 pb-2 mb-6 border-b border-border">

      {/* Left: Filters - Using shadcn Tabs */}
      <Tabs value={activeFilter} onValueChange={onFilterChange} className="w-full sm:w-auto">
        <TabsList className="bg-transparent border-0 rounded-none p-0 h-auto shadow-none flex items-center gap-6 overflow-x-auto overflow-y-hidden w-full sm:w-auto border-b sm:border-0 border-border">
          {filters.map((filter) => (
            <TabsTrigger
              key={filter}
              value={filter}
              className={cn(
                "px-3 py-2 text-sm transition-all relative whitespace-nowrap",
                "data-[state=active]:text-foreground data-[state=active]:font-semibold",
                "data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                "dark:data-[state=active]:bg-transparent",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                "bg-transparent border-0 rounded-none shadow-none",
                "focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-none",
                "hover:shadow-none hover:bg-transparent dark:hover:bg-transparent"
              )}
              asChild
            >
              <button className="relative">
                {filter}
                {activeFilter === filter && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">

        {/* Dropdowns - Minimal Text */}
        <div className="flex items-center gap-4 hidden lg:flex">
             <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span>日期</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span>类型</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
        </div>

        <div className="h-4 w-[1px] bg-border hidden lg:block"></div>

        {/* View Toggle - Single button that switches between grid and list */}
        <button
          onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {view === 'grid' ? (
            <>
              <List size={18} />
              <span>列表</span>
            </>
          ) : (
            <>
              <LayoutGrid size={18} />
              <span>网格</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
