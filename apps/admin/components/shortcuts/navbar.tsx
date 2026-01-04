import React from 'react';
import { Search, Bell, Plus, Aperture } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-black text-white p-2 rounded-md">
          <Aperture size={20} />
        </div>
        <span className="font-semibold text-lg tracking-tight text-gray-900">Lumina 影像</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-black transition-colors" />
          <Input
            className="w-full pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 transition-all rounded-md h-10"
            placeholder="搜索项目、客户或照片..."
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">Alex Morgan</p>
            <p className="text-xs text-gray-500 mt-1">首席摄影师</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User"
            className="w-9 h-9 rounded-full object-cover border border-gray-200"
          />
        </div>

        <Button className="rounded-md px-6 bg-black hover:bg-gray-800 text-white gap-2 ml-2">
          <Plus size={16} />
          <span>新建项目</span>
        </Button>
      </div>
    </nav>
  );
}
