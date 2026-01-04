import React from 'react';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function FilterBar() {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = React.useState('全部');

  const filters = ['全部', '进行中', '选片中', '修图中', '已交付'];

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 py-6 mb-4">

      {/* Left: Filters - Using shadcn Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-auto">
        <TabsList className="bg-transparent border-0 rounded-none p-0 h-auto shadow-none flex items-center gap-6 overflow-x-auto overflow-y-hidden w-full sm:w-auto border-b sm:border-0 border-gray-100">
          {filters.map((filter) => (
            <TabsTrigger
              key={filter}
              value={filter}
              className={cn(
                "px-3 py-2 text-sm transition-all relative whitespace-nowrap",
                "data-[state=active]:text-black data-[state=active]:font-semibold",
                "data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                "dark:data-[state=active]:bg-transparent",
                "data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-900",
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
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-sm"
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
             <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <span>日期</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <span>类型</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden lg:block"></div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={cn(
              "transition-colors",
              view === 'grid' ? "text-black" : "text-gray-300 hover:text-gray-500"
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              "transition-colors",
              view === 'list' ? "text-black" : "text-gray-300 hover:text-gray-500"
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
