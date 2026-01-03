"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, UploadCloud, Trash2, Check, Plus, Star, Image as ImageIcon, Layout, Type, Tag, Activity } from 'lucide-react';
import { Photo, PhotoStatus } from '../types';
import { CATEGORIES } from '../constants';

interface PhotoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  photo?: Photo | null;
}

/**
 * PhotoDrawer - 全屏编辑抽屉
 * 左侧：图片预览+多图管理
 * 右侧：编辑表单
 */
export const PhotoDrawer: React.FC<PhotoDrawerProps> = ({ isOpen, onClose, photo }) => {
  // 本地状态
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [gallery, setGallery] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<PhotoStatus>(PhotoStatus.DRAFT);
  const [description, setDescription] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPending, startTransition] = useTransition();

  // 初始化
  useEffect(() => {
    if (isOpen && photo) {
      // 批量更新状态以避免级联渲染
      startTransition(() => {
        setTitle(photo.title);
        setCategory(photo.category);
        setStatus(photo.status);
        setDescription(photo.description || '');
        setIsRecommended(photo.isRecommended || false);
        setTags(photo.tags);
        // 初始化图库：使用提供的图库或回退到单个url
        const initGallery = photo.gallery && photo.gallery.length > 0 ? photo.gallery : [photo.url];
        setGallery(initGallery);
        setActiveImageIndex(0);
      });
    } else if (isOpen && !photo) {
      // 新建模式 - 批量更新状态以避免级联渲染
      startTransition(() => {
        setTitle('');
        setCategory(CATEGORIES[1]); // 默认为第一个实际分类
        setStatus(PhotoStatus.DRAFT);
        setDescription('');
        setIsRecommended(false);
        setTags([]);
        setGallery([]);
        setActiveImageIndex(0);
      });
    }
  }, [isOpen, photo]);

  if (!isOpen) return null;

  // 处理函数
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = () => {
    // Mock上传 - 实际应用中会触发文件输入
    const mockNewImage = `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/800/600`;
    setGallery([...gallery, mockNewImage]);
    setActiveImageIndex(gallery.length); // 切换到新图片
  };

  const handleDeleteCurrentPhoto = () => {
    if (gallery.length === 0) return;
    const newGallery = gallery.filter((_, idx) => idx !== activeImageIndex);
    setGallery(newGallery);
    if (activeImageIndex >= newGallery.length) {
        setActiveImageIndex(Math.max(0, newGallery.length - 1));
    }
  };

  // 准备Select选项
  const categoryOptions = CATEGORIES.filter(c => c !== '全部').map(c => ({ label: c, value: c }));

  const statusOptions = [
    { label: '已发布', value: PhotoStatus.PUBLISHED, dotColor: 'bg-emerald-500' },
    { label: '草稿', value: PhotoStatus.DRAFT, dotColor: 'bg-amber-500' },
    { label: '已归档', value: PhotoStatus.ARCHIVED, dotColor: 'bg-slate-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-background/95 backdrop-blur-3xl transition-all duration-300 animate-in fade-in zoom-in-95">

       {/* 左侧区域：图片预览+图库管理 */}
       <div className="relative w-full md:flex-1 h-[45vh] md:h-full flex flex-col bg-muted/20 select-none border-b md:border-b-0 md:border-r border-border/50">

          {/* 顶部栏（移动端关闭按钮） */}
          <div className="md:hidden absolute top-4 left-4 z-30">
             <button onClick={onClose} className="p-2 rounded-full bg-background/50 backdrop-blur text-foreground shadow-sm">
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
                            alt="Preview"
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

                         {/* 删除图片覆盖按钮 */}
                         <button
                            onClick={handleDeleteCurrentPhoto}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                            title="移除此图片"
                         >
                            <Trash2 size={18} />
                         </button>
                    </div>
                 </>
             ) : (
                <div
                    onClick={handleImageUpload}
                    className="flex flex-col items-center justify-center gap-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors p-10 border-2 border-dashed border-border rounded-3xl"
                >
                    <UploadCloud size={64} strokeWidth={1} />
                    <span className="font-bold tracking-widest uppercase opacity-70">点击上传图片</span>
                </div>
             )}
          </div>

          {/* 底部条：图库缩略图 */}
          <div className="h-24 md:h-32 bg-background/50 backdrop-blur-md border-t border-border/50 flex items-center px-4 md:px-8 gap-3 overflow-x-auto no-scrollbar shrink-0">
               {gallery.map((img, idx) => (
                   <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-16 md:h-20 md:w-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          activeImageIndex === idx
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 opacity-100'
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                   >
                       <img src={img} className="w-full h-full object-cover" alt={`thumb-${idx}`} />
                       {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">封面</span>}
                   </button>
               ))}

               {/* 添加图片按钮 */}
               <button
                  onClick={handleImageUpload}
                  className="h-16 w-16 md:h-20 md:w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex-shrink-0 gap-1"
                  title="添加图片"
               >
                   <Plus size={24} />
                   <span className="text-[10px] font-bold">添加</span>
               </button>
          </div>
       </div>

       {/* 右侧区域：编辑表单 */}
       <div className="w-full md:w-[480px] bg-card flex flex-col h-[55vh] md:h-full shadow-2xl relative z-20">

           {/* 头部 */}
           <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
               <h2 className="text-xl font-black tracking-tight text-foreground">
                   {photo ? '编辑作品' : '新建作品'}
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

           {/* 可滚动表单主体 */}
           <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

               {/* 1. 标题输入 */}
               <div className="space-y-3">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Type size={14} /> 标题
                   </label>
                   <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-xl px-4 py-3 text-lg font-bold text-foreground transition-all outline-none placeholder:text-muted-foreground/40"
                      placeholder="为作品起个名字..."
                   />
               </div>

               {/* 2. 分类 & 状态（使用自定义Select） */}
               <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                       <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <Layout size={14} /> 分类
                       </label>
                       <CustomSelect
                          value={category}
                          onChange={setCategory}
                          options={categoryOptions}
                       />
                   </div>

                   <div className="space-y-3">
                       <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <Activity size={14} /> 状态
                       </label>
                       <CustomSelect
                          value={status}
                          onChange={(val) => setStatus(val as PhotoStatus)}
                          options={statusOptions}
                       />
                   </div>
               </div>

               {/* 3. 推荐 */}
               <div className="space-y-3">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Star size={14} /> 首页推荐
                   </label>
                   <div className="flex items-center h-[46px]">
                       <button
                            onClick={() => setIsRecommended(!isRecommended)}
                            className={`
                                relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out
                                ${isRecommended ? 'bg-primary' : 'bg-muted'}
                            `}
                       >
                           <span
                                className={`
                                    absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300
                                    ${isRecommended ? 'translate-x-6' : 'translate-x-0'}
                                `}
                           />
                       </button>
                       <span className="ml-3 text-xs font-bold text-muted-foreground">
                           {isRecommended ? '已开启' : '已关闭'}
                       </span>
                   </div>
               </div>

               {/* 4. 描述 */}
               <div className="space-y-3">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Type size={14} /> 作品描述
                   </label>
                   <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-xl px-4 py-3 text-sm font-medium leading-relaxed text-foreground min-h-[120px] transition-all outline-none resize-none placeholder:text-muted-foreground/40"
                      placeholder="描述创作灵感、拍摄背景或技术细节..."
                   />
               </div>

               {/* 5. 标签管理 */}
               <div className="space-y-3">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Tag size={14} /> 标签
                   </label>

                   <div className="flex flex-wrap gap-2 mb-3">
                       {tags.map(tag => (
                           <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground group border border-transparent hover:border-border transition-all">
                               #{tag}
                               <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-destructive transition-colors">
                                   <X size={12} />
                               </button>
                           </span>
                       ))}
                   </div>

                   <div className="flex gap-2">
                       <input
                           type="text"
                           value={newTag}
                           onChange={(e) => setNewTag(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                           className="flex-1 bg-muted/30 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-xl px-4 py-2 text-sm font-bold text-foreground transition-all outline-none"
                           placeholder="输入标签按回车添加..."
                       />
                       <button
                           onClick={handleAddTag}
                           className="px-4 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-colors"
                       >
                           <Plus size={20} />
                       </button>
                   </div>
               </div>

               {/* 6. 信息块（只读） */}
               {photo && (
                   <div className="p-4 rounded-xl bg-muted/20 border border-border/50 grid grid-cols-2 gap-4">
                       <div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">创建时间</div>
                           <div className="text-xs font-mono font-medium">{photo.date}</div>
                       </div>
                       <div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">图片数量</div>
                           <div className="text-xs font-mono font-medium">{gallery.length} 张</div>
                       </div>
                   </div>
               )}

           </div>

           {/* 粘性底部操作栏 */}
           <div className="p-6 border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 z-10 flex flex-col gap-3">
               <button className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide">
                   <Check size={18} strokeWidth={3} />
                   保存更改
               </button>

               {photo && (
                   <button className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30 font-bold text-sm transition-all flex items-center justify-center gap-2">
                       <Trash2 size={16} />
                       删除作品
                   </button>
               )}
           </div>
       </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 可复用的Shadcn风格Select组件（内部）
// ----------------------------------------------------------------------

interface SelectOption {
  label: string;
  value: string;
  dotColor?: string; // 可选的状态颜色圆点
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      {/* 触发器 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-muted/30 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-foreground transition-all outline-none ${
          isOpen ? 'bg-background border-primary/20 shadow-lg shadow-primary/5' : 'hover:bg-muted/50'
        }`}
      >
        <span className="flex items-center gap-2">
           {selectedOption?.dotColor && (
              <span className={`w-2 h-2 rounded-full ${selectedOption.dotColor}`} />
           )}
           {selectedOption?.label || value}
        </span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 内容 */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl shadow-black/10 animate-in fade-in-0 zoom-in-95">
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-2 text-sm font-bold outline-none transition-colors ${
                  option.value === value
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2 flex-1">
                   {option.dotColor && (
                      <span className={`w-2 h-2 rounded-full ${option.dotColor}`} />
                   )}
                   {option.label}
                </span>
                {option.value === value && (
                  <span className="flex items-center justify-center w-4 h-4 mr-2">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
