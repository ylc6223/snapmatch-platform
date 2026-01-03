"use client";

import React from 'react';
import { Plus } from 'lucide-react';

interface ToolbarProps {
  onUpload: () => void;
}

/**
 * Toolbar - 右下角浮动操作按钮（FAB）
 * 特点：hover动画、tooltip提示
 */
export const Toolbar: React.FC<ToolbarProps> = ({ onUpload }) => {
  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 items-center">
      {/* 主操作按钮（FAB） */}
      <button
        onClick={onUpload}
        className="group relative flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute right-full mr-4 px-3 py-1 bg-card/80 backdrop-blur text-foreground text-sm font-bold rounded-lg opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none shadow-sm whitespace-nowrap">
            新建作品
        </span>
      </button>

    </div>
  );
};
