'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

export interface PhotoSidebarProps {
  isOpen: boolean;
  onFilterChange?: (filterType: string, value: string) => void;
  currentFilters?: {
    orientation?: string;
    people?: string;
    age?: string;
  };
  className?: string;
}

export function PhotoSidebar({
  isOpen,
  onFilterChange,
  currentFilters = {},
  className,
}: PhotoSidebarProps) {
  return (
    <aside
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out border-r border-border bg-background sticky top-36 h-[calc(100vh-9rem)]',
        isOpen ? 'w-80 opacity-100 py-6 px-6' : 'w-0 opacity-0 p-0',
        className
      )}
    >
      <div className="w-68 min-w-[17rem]">
        <Accordion
          type="multiple"
          defaultValue={['orientation', 'people']}
          className="w-full space-y-4"
        >
          {/* Orientation */}
          <AccordionItem value="orientation" className="border-none">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-2">
              方向
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: '全部', icon: null },
                  { id: 'horizontal', label: '横向', icon: RectangleHorizontal },
                  { id: 'vertical', label: '纵向', icon: RectangleVertical },
                  { id: 'square', label: '方形', icon: Square },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = currentFilters.orientation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 p-2 border rounded-md transition-colors',
                        isSelected
                          ? 'bg-muted border-foreground text-foreground'
                          : 'bg-background border-border text-muted-foreground hover:border-border hover:text-foreground'
                      )}
                      onClick={() => onFilterChange?.('orientation', opt.id)}
                    >
                      {Icon ? (
                        <Icon className="w-5 h-5" />
                      ) : (
                        <div className="w-4 h-4 border border-current rounded-[1px] bg-muted-foreground/20" />
                      )}
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* People */}
          <AccordionItem value="people" className="border-none">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-2">
              人数
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {['全部', '无人', '1人', '2人', '3人以上'].map((opt, i) => {
                  const value = i === 0 ? '' : opt;
                  const isSelected = currentFilters.people === value;
                  return (
                    <button
                      key={opt}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                        isSelected
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
                      )}
                      onClick={() => onFilterChange?.('people', value)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Age */}
          <AccordionItem value="age" className="border-none">
            <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-2">
              年龄
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {['全部', '婴幼儿', '儿童', '青少年', '青年', '成年', '老年'].map((opt, i) => {
                  const value = i === 0 ? '' : opt;
                  const isSelected = currentFilters.age === value;
                  return (
                    <button
                      key={opt}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                        isSelected
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
                      )}
                      onClick={() => onFilterChange?.('age', value)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
