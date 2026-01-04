import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-background sticky top-0 z-50 border-b border-border">
      {/* Left: Logo placeholder */}
      <div className="w-40"></div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-foreground transition-colors" />
          <Input
            className="w-full pl-10 bg-primary/5 dark:bg-primary/10 border border-border focus:bg-background focus:border-primary/30 transition-all rounded-md h-10"
            placeholder="搜索项目、客户或照片..."
          />
        </div>
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
