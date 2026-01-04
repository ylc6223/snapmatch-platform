import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandInput } from '@/components/ui/command';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background sticky top-0 z-50 border-b border-border">
      {/* Left: Logo placeholder */}
      <div className="w-40"></div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8">
        <CommandInput
          placeholder="搜索项目、客户或照片..."
          className="h-10 bg-primary/5 dark:bg-primary/10 border border-border focus-within:bg-background focus-within:border-primary/30 rounded-md"
          wrapperClassName="border-0 px-3 gap-2"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Button className="rounded-md px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus size={16} />
          <span>新建项目</span>
        </Button>
      </div>
    </nav>
  );
}
