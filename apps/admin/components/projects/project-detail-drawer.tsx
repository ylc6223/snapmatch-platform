"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, User, Calendar, Image as ImageIcon, Tag, FileText, Building2 } from 'lucide-react';
import { Project, ProjectStatus } from '@snapmatch/shared-types';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { cn } from '@/lib/utils';

dayjs.locale('zh-cn');

interface ProjectDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

/**
 * ProjectDetailDrawer - 项目详情全屏抽屉
 * 设计风格参考 PhotoDrawer，保持一致的视觉体验
 * 左侧：项目封面 + 照片画廊
 * 右侧：项目信息表单
 */
export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const gallery = project.coverImageUrl
    ? [project.coverImageUrl]
    : ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80'];

  if (!isOpen) return null;

  // 状态颜色映射
  const getStatusColor = (status: ProjectStatus) => {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.PENDING]: 'bg-amber-500',
      [ProjectStatus.SELECTING]: 'bg-blue-500',
      [ProjectStatus.SUBMITTED]: 'bg-indigo-500',
      [ProjectStatus.RETOUCHING]: 'bg-cyan-500',
      [ProjectStatus.PENDING_CONFIRMATION]: 'bg-orange-500',
      [ProjectStatus.DELIVERED]: 'bg-green-500',
      [ProjectStatus.CANCELLED]: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusLabel = (status: ProjectStatus) => {
    const labels: Record<ProjectStatus, string> = {
      [ProjectStatus.PENDING]: '待选片',
      [ProjectStatus.SELECTING]: '选片中',
      [ProjectStatus.SUBMITTED]: '已提交',
      [ProjectStatus.RETOUCHING]: '修图中',
      [ProjectStatus.PENDING_CONFIRMATION]: '待确认',
      [ProjectStatus.DELIVERED]: '已交付',
      [ProjectStatus.CANCELLED]: '已取消',
    };
    return labels[status] || status;
  };

  const statusColor = getStatusColor(project.status as ProjectStatus);
  const statusLabel = getStatusLabel(project.status as ProjectStatus);

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-background/95 backdrop-blur-3xl transition-all duration-300 animate-in fade-in zoom-in-95">

      {/* 左侧区域：项目封面 + 照片画廊 */}
      <div className="relative w-full md:flex-1 h-[45vh] md:h-full flex flex-col bg-muted/20 select-none border-b md:border-b-0 md:border-r border-border/50">

        {/* 顶部栏（移动端关闭按钮） */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-background/50 backdrop-blur text-foreground shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* 主舞台 */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-10 group">
          {gallery.length > 0 ? (
            <>
              {/* 主图 */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={gallery[activeImageIndex]}
                  alt={project.name}
                  className="max-w-full max-h-full object-contain shadow-2xl shadow-black/20 rounded-lg transition-transform duration-300"
                />

                {/* 导航箭头 */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                      className="absolute left-2 md:left-8 p-3 rounded-full bg-background/10 hover:bg-background/80 text-foreground/50 hover:text-foreground backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % gallery.length)}
                      className="absolute right-2 md:right-8 p-3 rounded-full bg-background/10 hover:bg-background/80 text-foreground/50 hover:text-foreground backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-10">
              <ImageIcon size={64} strokeWidth={1} />
              <span className="font-bold tracking-widest uppercase opacity-70">暂无照片</span>
            </div>
          )}
        </div>

        {/* 底部条：照片缩略图 */}
        {gallery.length > 1 && (
          <div className="h-24 md:h-32 bg-background/50 backdrop-blur-md border-t border-border/50 flex items-center px-4 md:px-8 gap-3 overflow-x-auto no-scrollbar shrink-0">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={cn(
                  "relative h-16 w-16 md:h-20 md:w-20 rounded-lg overflow-hidden flex-shrink-0 transition-all",
                  activeImageIndex === idx
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 opacity-100'
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                )}
              >
                <img src={img} className="w-full h-full object-cover" alt={`thumb-${idx}`} />
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                    封面
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧区域：项目信息 */}
      <div className="w-full md:w-[480px] bg-card flex flex-col h-[55vh] md:h-full shadow-2xl relative z-20">

        {/* 头部 */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
          <h2 className="text-xl font-black tracking-tight text-foreground">
            项目详情
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 可滚动信息主体 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

          {/* 1. 项目名称 */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> 项目名称
            </label>
            <div className="w-full bg-muted/30 rounded-xl px-4 py-3 text-lg font-bold text-foreground">
              {project.name}
            </div>
          </div>

          {/* 2. 客户名称 & 状态 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> 客户
              </label>
              <div className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold text-foreground">
                {project.customerName || '未知'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Building2 size={14} /> 状态
              </label>
              <div className="flex items-center gap-2 w-full bg-muted/30 rounded-xl px-4 py-3">
                <span className={cn("w-2 h-2 rounded-full", statusColor)} />
                <span className="text-sm font-bold text-foreground">{statusLabel}</span>
              </div>
            </div>
          </div>

          {/* 3. 照片数量 */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> 照片数量
            </label>
            <div className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold text-foreground">
              {project.photoCount} 张
            </div>
          </div>

          {/* 4. 项目描述 */}
          {project.description && (
            <div className="space-y-3">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> 项目描述
              </label>
              <div className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-medium leading-relaxed text-foreground min-h-[80px]">
                {project.description}
              </div>
            </div>
          )}

          {/* 5. 信息块（只读） */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">创建时间</div>
              <div className="text-xs font-mono font-medium">
                {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">最后更新</div>
              <div className="text-xs font-mono font-medium">
                {dayjs(project.updatedAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
            {project.shootDate && (
              <>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">拍摄日期</div>
                  <div className="text-xs font-mono font-medium">
                    {dayjs(project.shootDate).format('YYYY-MM-DD')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">项目 ID</div>
                  <div className="text-xs font-mono font-medium truncate">
                    {project.id}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* 粘性底部操作栏 */}
        <div className="p-6 border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 z-10 flex flex-col gap-3">
          <button
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide"
            onClick={() => {
              // TODO: 实现编辑功能
              console.log('编辑项目:', project.id);
            }}
          >
            <FileText size={18} strokeWidth={3} />
            编辑项目
          </button>

          <button
            className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30 font-bold text-sm transition-all flex items-center justify-center gap-2"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
